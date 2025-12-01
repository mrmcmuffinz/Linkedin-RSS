# Linkedin-RSS

Post the latest post from your RSS Feed to your LinkedIn Profile

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/a791c7e4a26e44909a44783c6ff0ffd4)](https://app.codacy.com/gh/mrmcmuffinz/Linkedin-RSS/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

## How to use

1.  Create a folder named .github and create a workflows folder inside it, if it doesn't exist.

2.  Create a new .yml file with the following contents inside the workflows folder:

```yaml
name: Linkedin blog post workflow

permissions:
  contents: write

on:
  schedule:
    - cron: "0 * * * *"
  workflow_dispatch: {}

jobs:
  linkedin_rss_job:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          persist-credentials: true
      - name: Post latest blog post to LinkedIn
        uses: mrmcmuffinz/Linkedin-RSS/@main
        with:
          feed_list: "https://mrmcmuffinz.github.io/posts/index.xml"
          ln_access_token: "${{ secrets.LINKEDIN_ACCESS_TOKEN }}"
          embed_image: "https://mrmcmuffinz.github.io/images/social-card.png"
          last_post_path: ".github/.lastPost.txt"
          commit_user: "linkedin-bot"
          commit_email: "...@users.noreply.github.com"
          commit_message: "Update last LinkedIn post marker"
```

| Parameter         | Required | Description                                                  | Default                            |
| ----------------- | -------- | ------------------------------------------------------------ | ---------------------------------- |
| `feed_list`       | ✓        | Your own RSS feed URL                                        | (No Default URL)                   |
| `ln_access_token` | ✓        | Your LinkedIn Access Token                                   | (No Default Access Token)          |
| `embed_image`     | X        | The URL of the image you want to use in the embed.           | (No Default URL)                   |
| `last_post_path`  | X        | The path to the file you want to use to store the last post. | `.github/.lastPost.txt`            |
| `commit_user`     | X        | The username of the commiter.                                | `Linkedin-Post-Action`             |
| `commit_email`    | X        | The email of the commiter.                                   | `linkedin-post-action@example.com` |
| `commit_message`  | X        | The commit message.                                          | `Update Last Post File`            |

## How to get your LinkedIn Access Token

Register the app in [LinkedIn Developer Network](https://developer.linkedin.com/)

-   Go to LinkedIn Developer Network and create an app;
-   Select `Test University` or `PersonalDev` can be used as the company associated with the app without verification;

#

-   Once you made your Application go to your App and go to "Products"
-   From there Select "Share on LinkedIn" and "Sign In with LinkedIn using OpenID Connect" and "Request Access" For both of them

#

-   Once you have added your Products go to https://www.linkedin.com/developers/tools/oauth/
-   Select "Create a new access token" and click "Create Token" Select your app and make sure you have the `openid`, `profile` and `w_member_social` scopes selected.
-   Press "Request Access Token" and you will be asked to login. After Successfully logging in you will be given your Access Token.

# Notices

> **I suggest for your ln_access_token you use a Github Secret. (Whats a Github Secret check here https://docs.github.com/en/actions/security-guides/encrypted-secrets)**

> Thanks to https://github.com/gfiocco/linkedin-node-api as the LinkedIn Docs are wierd..

## Code and bug reporting

You can open a issue at https://github.com/mrmcmuffinz/Linkedin-RSS
