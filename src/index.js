import * as core from "@actions/core";
import * as exec from "@actions/exec";
import RSSParser from "rss-parser";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------------------------------------------------
// Generic Node.js API to post on LinkedIn
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Retrieves the LinkedIn user ID (owner ID) using the provided access token.
 * First attempts to get the ID from /v2/userinfo endpoint. If the 'sub' field
 * is not present, falls back to /v2/me endpoint.
 *
 * @param {string} accessToken - LinkedIn OAuth access token
 * @returns {Promise<string>} The LinkedIn user ID
 * @throws {Error} If the API request fails or the response is invalid
 *
 * @example
 * const ownerId = await getLinkedinId('your-access-token');
 * console.log(ownerId); // 'abc123xyz'
 */
async function getLinkedinId(accessToken) {
  const hostname = "api.linkedin.com";
  const pathUrl = "/v2/userinfo";
  const method = "GET";
  const headers = {
    Authorization: "Bearer " + accessToken,
    "cache-control": "no-cache",
    "X-Restli-Protocol-Version": "2.0.0",
  };
  const body = "";

  try {
    core.debug("Fetching LinkedIn user info");
    const r = await _request(method, hostname, pathUrl, headers, body);
    const data = JSON.parse(r.body);

    // Check if sub exists
    if (data.sub) {
      core.debug(`Found LinkedIn ID: ${data.sub}`);
      return data.sub;
    }

    // If sub is empty, call /v2/me
    core.debug("No sub found, calling /v2/me");
    const meResponse = await _request(
      method,
      hostname,
      "/v2/me",
      headers,
      body,
    );
    const userId = JSON.parse(meResponse.body).id;
    core.debug(`Found LinkedIn ID from /v2/me: ${userId}`);
    return userId;
  } catch (error) {
    core.error(`Failed to get LinkedIn ID: ${error.message}`);
    throw error;
  }
}

/**
 * Checks if the latest post from the RSS feed has already been published to LinkedIn.
 * Reads the last published post URL from a file and compares it with the latest feed item.
 * If the file doesn't exist, it creates it.
 *
 * @param {Object} feed - Parsed RSS feed object from rss-parser
 * @param {Array} feed.items - Array of feed items
 * @param {string} feed.items[].link - URL of the feed item
 * @param {string} lastPostPath - Full file path where the last post URL is stored
 * @returns {boolean} True if the post was already published, false otherwise
 *
 * @example
 * const feed = await parser.parseURL('https://example.com/feed.xml');
 * const wasPublished = wasPostPublished(feed, '/path/to/.lastPost.txt');
 * if (wasPublished) {
 *   console.log('Already published!');
 * }
 */
function wasPostPublished(feed, lastPostPath) {
  let lastPostContent = "";

  try {
    lastPostContent = fs.readFileSync(lastPostPath, "utf8");
    core.debug(`Read last post file: ${lastPostPath}`);
  } catch {
    core.info(`No ${lastPostPath} file found, creating it`);

    // Create directories if they don't exist
    fs.mkdirSync(path.dirname(lastPostPath), { recursive: true });

    // Create file if it doesn't exist
    fs.writeFileSync(lastPostPath, "");
  }

  // If the post has been posted, skip
  if (lastPostContent === feed.items[0].link) {
    core.info(`Post already published: ${feed.items[0].link}`);
    return true;
  }

  // If the post has not been posted, write it
  fs.writeFileSync(lastPostPath, feed.items[0].link);
  core.info(`Saving post link to ${lastPostPath}: ${feed.items[0].link}`);

  return false;
}

/**
 * Commits and pushes the last post file to the git repository.
 * Configures git with the provided user credentials, checks for changes,
 * and pushes them to the remote repository.
 *
 * @param {string} lastPostPath - Full file path to the last post tracking file
 * @param {string} commitEmail - Email address for git commit author
 * @param {string} commitUser - Username for git commit author
 * @param {string} commitMessage - Commit message for the git commit
 * @returns {Promise<void>}
 * @throws {Error} If git operations fail
 *
 * @example
 * await pushPastFile(
 *   '/workspace/.github/.lastPost.txt',
 *   'bot@example.com',
 *   'LinkedIn Bot',
 *   'Update last post marker'
 * );
 */
async function pushPastFile(
  lastPostPath,
  commitEmail,
  commitUser,
  commitMessage,
) {
  try {
    core.info("Configuring git credentials");

    // Configure git
    await exec.exec("git", ["config", "user.email", commitEmail]);
    await exec.exec("git", ["config", "user.name", commitUser]);

    // Check if there are changes
    core.debug("Checking for git changes");
    const { stdout } = await exec.getExecOutput("git", [
      "status",
      "--porcelain",
    ]);

    if (!stdout.trim()) {
      core.info("No changes to commit");
      return;
    }

    // Add, commit, and push
    core.info(`Committing changes to ${lastPostPath}`);
    await exec.exec("git", ["add", lastPostPath]);
    await exec.exec("git", ["commit", "-m", commitMessage]);

    core.info("Pushing changes to repository");
    await exec.exec("git", ["push"]);

    core.info("Successfully pushed changes");
  } catch (err) {
    core.error(`Failed to push changes: ${err.message}`);
    throw err;
  }
}

/**
 * Posts a share/update to LinkedIn using the LinkedIn v2 API.
 * Creates a post with a title, text content, and optional thumbnail image.
 *
 * @param {string} accessToken - LinkedIn OAuth access token
 * @param {string} ownerId - LinkedIn user ID (URN format without prefix)
 * @param {string} title - Title of the share
 * @param {string} text - Main text content (max 1300 characters)
 * @param {string} shareUrl - URL to be shared
 * @param {string} shareThumbnailUrl - URL of the thumbnail image for the share
 * @returns {Promise<Object>} Response object containing status, headers, and body
 * @returns {number} returns.status - HTTP status code
 * @returns {Object} returns.headers - Response headers
 * @returns {string} returns.body - Response body as string
 * @throws {Error} If the API request fails
 *
 * @example
 * const result = await postShare(
 *   'access-token',
 *   'abc123',
 *   'Blog Post Title',
 *   'Check out my latest post!',
 *   'https://example.com/post',
 *   'https://example.com/image.jpg'
 * );
 * console.log(result.status); // 201
 */
async function postShare(
  accessToken,
  ownerId,
  title,
  text,
  shareUrl,
  shareThumbnailUrl,
) {
  const hostname = "api.linkedin.com";
  const pathUrl = "/v2/shares";
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

  core.debug(`Posting to LinkedIn: ${title}`);
  return await _request(
    method,
    hostname,
    pathUrl,
    headers,
    JSON.stringify(body),
  );
}

/**
 * Generic HTTPS request handler for making API calls.
 * Creates and executes an HTTPS request with the provided parameters.
 *
 * @private
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} hostname - API hostname (e.g., 'api.linkedin.com')
 * @param {string} pathUrl - URL path (e.g., '/v2/me')
 * @param {Object} headers - HTTP headers object
 * @param {string} body - Request body as a string (JSON stringified for POST/PUT)
 * @returns {Promise<Object>} Response object
 * @returns {number} returns.status - HTTP status code
 * @returns {Object} returns.headers - Response headers
 * @returns {string} returns.body - Response body as string
 * @throws {Error} If the request fails or encounters a network error
 *
 * @example
 * const response = await _request(
 *   'GET',
 *   'api.linkedin.com',
 *   '/v2/me',
 *   { 'Authorization': 'Bearer token' },
 *   ''
 * );
 */
function _request(method, hostname, pathUrl, headers, body) {
  return new Promise((resolve, reject) => {
    const reqOpts = {
      method,
      hostname,
      path: pathUrl,
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

/**
 * Main execution function for the GitHub Action.
 * Orchestrates the entire workflow:
 * 1. Validates inputs
 * 2. Parses RSS feed
 * 3. Checks if post was already published
 * 4. Posts to LinkedIn if new
 * 5. Updates tracking file and commits changes
 *
 * @async
 * @returns {Promise<void>}
 * @throws Will call core.setFailed() with error message on failure
 *
 * @description
 * This function reads GitHub Action inputs, parses an RSS feed,
 * and posts the latest item to LinkedIn if it hasn't been posted before.
 * After successful posting, it updates a tracking file with the post URL
 * and commits the change to the repository.
 *
 * Required GitHub Action Inputs:
 * - ln_access_token: LinkedIn OAuth access token
 * - feed_list: RSS feed URL
 * - last_post_path: Path to tracking file (default: .github/.lastPost.txt)
 * - commit_user: Git commit username (default: Linkedin-Post-Action)
 * - commit_email: Git commit email (default: linkedin-post-action@example.com)
 * - commit_message: Git commit message (default: Update Last Post File)
 *
 * Optional Inputs:
 * - embed_image: Custom thumbnail image URL for the LinkedIn post
 *
 * @example
 * // Called automatically when the action runs
 * run();
 */
async function run() {
  const accessToken = core.getInput("ln_access_token");
  const feedList = core.getInput("feed_list");
  const embedImage = core.getInput("embed_image");
  const lastPostPath = path.join(
    process.env.GITHUB_WORKSPACE,
    core.getInput("last_post_path"),
  );
  const commitUser = core.getInput("commit_user");
  const commitEmail = core.getInput("commit_email");
  const commitMessage = core.getInput("commit_message");

  // Validate required inputs
  if (!accessToken) {
    core.setFailed("LinkedIn access token is required");
    return;
  }

  if (!feedList) {
    core.setFailed("RSS feed URL is required");
    return;
  }

  try {
    core.info(`Parsing RSS feed: ${feedList}`);

    const feed = await new RSSParser().parseURL(feedList);
    core.info(`Feed title: ${feed.title}`);

    if (!feed.items || feed.items.length === 0) {
      core.setFailed("No items found in RSS feed");
      return;
    }

    core.info(`Latest post: ${feed.items[0].title}`);

    const ownerId = await getLinkedinId(accessToken);
    core.info(`LinkedIn owner ID: ${ownerId}`);

    const pastPostCheck = wasPostPublished(feed, lastPostPath);
    if (pastPostCheck) {
      core.warning("Post was already published");
      core.warning("Ending job because post was already published");
      return;
    }

    core.info("Posting to LinkedIn...");
    const result = await postShare(
      accessToken,
      ownerId,
      feed.title,
      feed.items[0].title,
      feed.items[0].link,
      embedImage ?? feed.items[0].link,
    );

    core.info(`LinkedIn API response status: ${result.status}`);

    if (result.status === 201) {
      core.info("✅ Successfully posted to LinkedIn");
      core.info(`Post: ${feed.items[0].title}`);
      core.info(`Link: ${feed.items[0].link}`);
      if (feed.items[0].contentSnippet) {
        core.info(`Content: ${feed.items[0].contentSnippet}`);
      }

      await pushPastFile(lastPostPath, commitEmail, commitUser, commitMessage);
    } else if (result.status === 401) {
      core.setFailed("Failed to post on LinkedIn: Invalid access token");
      core.error(
        "Please check your LinkedIn access token is valid and has not expired",
      );
    } else {
      core.setFailed(`Failed to post on LinkedIn (Status: ${result.status})`);
      core.error(`Response: ${result.body}`);
    }
  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
    core.error(error.stack || error);
  }
}

// Only run if this file is executed directly (not imported for tests)
if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}

// Export functions for testing
export { getLinkedinId, wasPostPublished, pushPastFile, postShare, _request };
