import * as core from "@actions/core";
import RSSParser from "rss-parser";
import https from "https";
import fs from "fs";
import path from "path";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------------------------------------------------
// Generic Node.js API to post on LinkedIn
// ---------------------------------------------------------------------------------------------------------------------
const accessToken = core.getInput("ln_access_token");
const feedList = core.getInput("feed_list");
const embedImage = core.getInput("embed_image");
const lastPostPath = core.getInput("last_post_path");

const commitUser = core.getInput("commit_user");
const commitEmail = core.getInput("commit_email");
const commitMessage = core.getInput("commit_message");

// Get LinkedIn ID, i.e. ownerId
function getLinkedinId(accessToken) {
  return new Promise((resolve, reject) => {
    const hostname = "api.linkedin.com";
    const path = "/v2/userinfo";
    const method = "GET";
    const headers = {
      Authorization: "Bearer " + accessToken,
      "cache-control": "no-cache",
      "X-Restli-Protocol-Version": "2.0.0",
    };
    const body = "";
    _request(method, hostname, path, headers, body)
      .then((r) => {
        // Check if sub has anything or else call /v2/me
        if (JSON.parse(r.body).sub) return resolve(JSON.parse(r.body).sub);
        // If sub is empty, call /v2/me
        const hostname = "api.linkedin.com";
        const path = "/v2/me";
        const method = "GET";

        _request(method, hostname, path, headers, body)
          .then((r) => {
            resolve(JSON.parse(r.body).id);
          })
          .catch((e) => reject(e));
      })
      .catch((e) => reject(e));
  });
}

// Check if post has already been published
function wasPostPublished(feed) {
  // Read .lastPost file in .github/workflows/ to check if the post has been posted
  const lastPost = path.join(process.env.GITHUB_WORKSPACE, lastPostPath);

  let lastPostContent = "";
  try {
    lastPostContent = fs.readFileSync(lastPost, "utf8");
  } catch {
    console.log("No .lastPost.txt file found");

    // Create directories if they dont exist
    fs.mkdirSync(path.dirname(lastPost), { recursive: true });

    // Create file if it doesn't exist
    fs.writeFileSync(lastPost, "");
  }
  // If the post has been posted, skip
  if (lastPostContent === feed.items[0].link) {
    console.log("Post already posted");
    return true;
  }
  // If the post has not been posted, post
  fs.writeFileSync(lastPost, feed.items[0].link);
  console.log("Writing post ", feed.items[0].link, " link to ", lastPost);

  return false;
}

function pushPastFile() {
  // push the file changes to repository
  const lastPost = path.join(process.env.GITHUB_WORKSPACE, lastPostPath);

  try {
    execSync(`git config user.email "${commitEmail}"`);
    execSync(`git config user.name "${commitUser}"`);
    const status = execSync("git status --porcelain").toString("utf8").trim();
    if (!status) {
      console.log("No changes to commit.");
      return;
    }
    execSync(`git add "${lastPost}"`, { stdio: "inherit" });
    const safeMsg = commitMessage.replace(/"/g, '\\"');
    execSync(`git commit -m "${safeMsg}"`, { stdio: "inherit" });
    execSync("git push", { stdio: "inherit" });
    console.log("pushPastFile: pushed successfully");
  } catch (err) {
    console.error("pushPastFile failed: ", err && err.message);
    if (err.stdout) console.error("stdout: ", err.stdout.toString());
    if (err.stderr) console.error("stderr: ", err.stderr.toString());
    throw err;
  }
}

// Publish content on LinkedIn
function postShare(
  accessToken,
  ownerId,
  title,
  text,
  shareUrl,
  shareThumbnailUrl,
) {
  return new Promise((resolve, reject) => {
    const hostname = "api.linkedin.com";
    const path = "/v2/shares";
    const method = "POST";
    const body = {
      owner: "urn:li:person:" + ownerId,
      subject: title,
      text: {
        text, // max 1300 characters
      },
      content: {
        contentEntities: [
          {
            entityLocation: shareUrl,
            thumbnails: [
              {
                resolvedUrl: shareThumbnailUrl,
              },
            ],
          },
        ],
        title,
      },
      distribution: {
        linkedInDistributionTarget: {},
      },
    };
    const headers = {
      Authorization: "Bearer " + accessToken,
      "cache-control": "no-cache",
      "X-Restli-Protocol-Version": "2.0.0",
      "Content-Type": "application/json",
      "x-li-format": "json",
      "Content-Length": Buffer.byteLength(JSON.stringify(body)),
    };
    _request(method, hostname, path, headers, JSON.stringify(body))
      .then((r) => {
        resolve(r);
      })
      .catch((e) => reject(e));
  });
}

// Generic HTTP requester
function _request(method, hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const reqOpts = {
      method,
      hostname,
      path,
      headers,
      rejectUnauthorized: false, // WARNING: accepting unauthorised end points for testing ONLY
    };
    let resBody = "";
    const req = https.request(reqOpts, (res) => {
      res.on("data", (data) => {
        resBody += data.toString("utf8");
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: resBody,
        });
      });
    });
    req.on("error", (e) => {
      reject(e);
    });
    if (method !== "GET") {
      req.write(body);
    }
    req.end();
  });
}

try {
  const parse = async (url) => {
    const feed = await new RSSParser().parseURL(url);

    console.log(feed.title);
    getLinkedinId(accessToken)
      .then((ownerId) => {
        const pastPostCheck = wasPostPublished(feed);
        if (pastPostCheck) {
          core.warning("Post was already published");
          core.warning("Ending job because post was already published");
          return;
        }

        postShare(
          accessToken,
          ownerId,
          feed.title,
          feed.items[0].title,
          feed.items[0].link,
          embedImage ?? feed.items[0].link,
        )
          .then((r) => {
            console.log(r); // status 201 signal successful posting
            if (r.status === 401) {
              core.setFailed(
                "Failed to post on LinkedIn, please check your access token is valid",
              );
              return;
            } else if (r.status !== 201) {
              core.setFailed("Failed to post on LinkedIn");
              return;
            }
            pushPastFile();
          })
          .catch((e) => console.log(e));
      })
      .catch((e) => console.log(e));
    console.log(
      `${feed.items[0].title} - ${feed.items[0].link}\n${feed.items[0].contentSnippet}\n\n`,
    );
  };

  console.log("Parsing " + feedList);

  parse(feedList);
} catch (error) {
  core.setFailed(error.message);
}
