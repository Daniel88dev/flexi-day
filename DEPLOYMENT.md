# Deployment — AWS S3 + CloudFront

This app is a **fully client-rendered Next.js app** (all pages are `"use client"`, all data
comes from an external backend via `NEXT_PUBLIC_API_URL`). It is built as a **static export**
and hosted on **S3 (private) behind CloudFront**. Deploys run automatically via GitHub Actions
on merge to `main`.

---

## 0. What's already done in the repo (no action needed)

- `next.config.ts` → `output: "export"` + `trailingSlash: true` (produces a static `out/` dir).
- The dynamic `[groupId]` route was refactored to `/groups/detail?groupId=…` so it works with
  static export (static export cannot render arbitrary path params at runtime).
- `.github/workflows/ci.yml` has a `deploy` job that, on push to `main` **after tests pass**,
  builds the export, syncs it to S3, and invalidates CloudFront — authenticating via **OIDC**
  (no long-lived AWS keys stored in GitHub).

Everything below is **infrastructure and config you must create outside the repo.** You'll
collect several values (ARNs, IDs) along the way — keep a scratch note; you paste them into
GitHub at Step 5.

### Placeholders used below

| Placeholder       | Meaning                          | Example                  |
| ----------------- | -------------------------------- | ------------------------ |
| `ACCOUNT_ID`      | 12-digit AWS account ID          | `123456789012`           |
| `REGION`          | Bucket region                    | `eu-central-1`           |
| `BUCKET`          | S3 bucket name (globally unique) | `flexiday-frontend-prod` |
| `GH_OWNER/REPO`   | GitHub org/user + repo           | `myorg/flexi-day`        |
| `DISTRIBUTION_ID` | CloudFront distribution ID       | `E1A2B3C4D5E6F7`         |

> **Bucket naming note:** S3 bucket **names are globally unique** across all AWS accounts and
> regions, but the **bucket itself is regional** (its objects live in `REGION`). Pick a unique
> name (add a suffix if needed) and one region. The bucket region does **not** need to match
> CloudFront; only the ACM certificate (Step 2) must be in `us-east-1`.

---

## 1. Create the S3 bucket (private)

Console → S3 → Create bucket.

1. Name: `BUCKET`. Region: `REGION`.
2. **Block all public access: ON** (keep all four checkboxes checked). With CloudFront + OAC the
   bucket stays private — do **not** enable "static website hosting" and do **not** make it public.
3. Leave versioning off (optional).
4. Create. Note the bucket ARN: `arn:aws:s3:::BUCKET`.

The bucket policy that grants CloudFront read access is added in Step 3 (you need the distribution
ARN first).

---

## 2. Request an ACM certificate (HTTPS + custom domain)

Only if you'll use a custom domain (recommended, and effectively required for `better-auth`
cookies).

1. Console → **Certificate Manager in `us-east-1` (N. Virginia)** — CloudFront only reads certs
   from `us-east-1`, regardless of your bucket region.
2. Request a public cert for your domain, e.g. `app.flexiday.com`.
3. Validate via DNS (add the CNAME ACM gives you to your DNS provider). Wait for status **Issued**.
4. Note the **certificate ARN**.

If you'll launch on the default `*.cloudfront.net` URL for now, skip this — that's still HTTPS,
just without your domain.

---

## 3. Create the CloudFront distribution

Console → CloudFront → Create distribution.

1. **Origin domain:** select your S3 bucket (pick the bucket, _not_ the website endpoint).
2. **Origin access:** choose **Origin access control (OAC)** → Create control setting → sign
   requests. This keeps the bucket private.
3. **Viewer protocol policy:** Redirect HTTP to HTTPS.
4. **Default root object:** `index.html`.
5. **Alternate domain name (CNAME):** `app.flexiday.com` + attach the ACM cert from Step 2
   (skip if using the default domain).
6. Create the distribution. Note the **Distribution ID** and its **domain name**
   (`dxxxx.cloudfront.net`).
7. **Custom error responses** (critical for client-side routing — without these, refreshing
   `/dashboard/` or hitting `/groups/detail/` returns 403). Distribution → Error pages → Create
   custom error response, twice:
   - HTTP error code **403** → Customize error response: Yes → Response page path `/index.html`
     → HTTP Response code **200**.
   - HTTP error code **404** → same: `/index.html` → **200**.
8. **Attach the bucket policy CloudFront generated:** when you set up OAC, the console shows a
   "copy policy" button — copy it into S3 → your bucket → Permissions → Bucket policy. It looks
   like:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

---

## 4. Set up GitHub OIDC → IAM role

So the pipeline can deploy without stored AWS keys.

### 4a. Create the OIDC identity provider (once per account)

IAM → Identity providers → Add provider → **OpenID Connect**:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

### 4b. Create the IAM role with this trust policy

Restricts the role to your repo's `main` branch:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:GH_OWNER/REPO:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

### 4c. Attach this permissions policy to the role

S3 sync + CloudFront invalidation:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Sync",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::BUCKET"
    },
    {
      "Sid": "S3Objects",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::BUCKET/*"
    },
    {
      "Sid": "CloudFrontInvalidate",
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
    }
  ]
}
```

Note the **role ARN**: `arn:aws:iam::ACCOUNT_ID:role/…`.

---

## 5. Add the values to GitHub

Repo → **Settings → Secrets and variables → Actions**.

The workflow uses `environment: production`, so ideally add these on a **Production environment**
(Settings → Environments → New environment → `production`), where you can also add a
required-reviewer approval gate. Repo-level also works.

| Name                         | Kind       | Value                                                   |
| ---------------------------- | ---------- | ------------------------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN`        | **Secret** | role ARN from Step 4b                                   |
| `AWS_REGION`                 | Variable   | `REGION`                                                |
| `AWS_S3_BUCKET`              | Variable   | `BUCKET`                                                |
| `CLOUDFRONT_DISTRIBUTION_ID` | Variable   | Distribution ID from Step 3                             |
| `NEXT_PUBLIC_API_URL`        | Variable   | production backend URL, e.g. `https://api.flexiday.com` |

> `NEXT_PUBLIC_API_URL` is **baked into the bundle at build time** — it must be set here, not at
> runtime.

---

## 6. Point DNS at CloudFront (custom domain only)

In your DNS provider, create a record for `app.flexiday.com`:

- Route 53: **A / AAAA alias** → the CloudFront distribution.
- Other providers: **CNAME** → `dxxxx.cloudfront.net`.

---

## 7. Backend changes (CORS + cookies) — required for auth

The frontend now lives on a different origin than the API and calls
`fetch(..., { credentials: "include" })` with `better-auth`. On the **backend** you must:

1. Set CORS to allow your exact frontend origin (not `*` when credentials are used):
   - `Access-Control-Allow-Origin: https://app.flexiday.com`
   - `Access-Control-Allow-Credentials: true`
   - allow the methods/headers the app sends (`Content-Type`, etc.).
2. Issue auth/session cookies with `Secure` and `SameSite=None` so the browser sends them
   cross-site over HTTPS. (This is why HTTPS/CloudFront matters — plain S3 HTTP would break this.)

---

## 8. First deploy & verify

1. Merge the repo changes (or push) to `main`.
2. GitHub → **Actions** tab → watch the `CI` run: `test` job, then `deploy` job. Confirm the AWS
   credential step assumes the role, both `s3 sync` passes run, and the CloudFront invalidation is
   created.
3. Open `https://app.flexiday.com` (or the `*.cloudfront.net` URL) and check:
   - Home page loads.
   - Deep-link/refresh works: navigate to `/dashboard/` and refresh — should load, not 403
     (validates the Step 3.7 error responses).
   - DevTools → Network → API calls go to your `NEXT_PUBLIC_API_URL` and, after login, cookies are
     set and sent.

---

## Optional: manual deploy (break-glass)

Handy for the very first push or a hotfix, once your local AWS CLI is configured:

```bash
NEXT_PUBLIC_API_URL=https://api.flexiday.com npm run build
aws s3 sync out/ s3://BUCKET/ --delete
aws cloudfront create-invalidation --distribution-id DISTRIBUTION_ID --paths "/*"
```

---

## Critical path (summary)

1. Private S3 bucket
2. ACM cert (`us-east-1`)
3. CloudFront + OAC + 403/404 → `/index.html` rewrites + bucket policy
4. OIDC provider + IAM role (trust + S3/CloudFront perms)
5. GitHub vars/secrets
6. DNS
7. Backend CORS/cookies
8. Merge to `main` and verify

**Most commonly missed:** the **403/404 → `/index.html`** custom error responses (Step 3.7), the
backend **`SameSite=None; Secure` + CORS** (Step 7), and setting **`NEXT_PUBLIC_API_URL` at build
time** (Step 5, baked into the bundle).
