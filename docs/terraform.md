# Terraform

`terraform/` holds what serves `www.flexi-day.com`: the CloudFront distribution, its viewer-request
function, the origin access control, and the S3 bucket the deploy job syncs the static export into.
All of it was first clicked together in the console in July 2026. `terraform import` brought it in
later, so the code describes what was already running rather than something Terraform created.

State is a local file, `terraform/terraform.tfstate`, gitignored, with no S3 backend. It lives on one
machine and plans only run from that checkout, the same as `flexi-day-be/terraform/`.

## What it manages

| Resource                                                  | Live object                                           |
| --------------------------------------------------------- | ----------------------------------------------------- |
| `aws_cloudfront_function.redirect`                        | `flexi-day-redirect`, code in `functions/redirect.js` |
| `aws_cloudfront_distribution.site`                        | `EQG4OWS15ZIN7`                                       |
| `aws_cloudfront_origin_access_control.site`               | `E16SLUJTCTLL2C`                                      |
| `aws_s3_bucket.site`                                      | `flexiday-frontend` (`eu-central-1`)                  |
| `aws_s3_bucket_policy.site`                               | lets only this distribution read objects              |
| `aws_s3_bucket_public_access_block.site`                  | all four blocks on                                    |
| `aws_s3_bucket_ownership_controls.site`                   | `BucketOwnerEnforced`                                 |
| `aws_s3_bucket_server_side_encryption_configuration.site` | SSE-S3 with a bucket key, SSE-C blocked               |

The function does two things on every viewer request. It sends `flexi-day.com` to
`https://www.flexi-day.com` with a 301. On `www` it maps extensionless paths onto the export's
folder layout, so `/sign-in` fetches `/sign-in/index.html`. An S3 origin behind OAC does no
directory-index lookup of its own. Paths under `/.well-known/` pass through untouched, so the Apple app site
association file reaches S3 under its own key. A missing key comes back from S3 as 403, and both
403 and 404 serve `/404.html` with status 200.

## What is still by hand

- The ACM certificate in `us-east-1` and the WAF web ACL CloudFront created for the distribution.
  The distribution references both by ARN through `variables.tf`; Terraform does not manage either.
- The Route 53 A and AAAA alias records for `flexi-day.com` and `www.flexi-day.com`. The hosted zone
  is shared with the backend, whose Terraform manages only the `api` records.
- Bucket versioning. Nobody turned it on and Terraform sets nothing, so it stays off.
- The deploy role behind the `AWS_DEPLOY_ROLE_ARN` secret, and the repository variables the deploy
  job in `.github/workflows/ci.yml` reads (`AWS_S3_BUCKET`, `CLOUDFRONT_DISTRIBUTION_ID`,
  `AWS_REGION`, `NEXT_PUBLIC_*`). The `site_bucket_name` and `distribution_id` outputs give the
  values those variables must hold. Set them with `gh variable set`.
- The site's content. The deploy job syncs `out/` into the bucket and invalidates `/*`. Terraform
  never touches objects.

## Changing the redirect function

Edit `functions/redirect.js` and plan. The plan shows the code diff on
`aws_cloudfront_function.redirect` and nothing else, and the apply publishes it straight to LIVE,
since `publish = true`. The distribution points at the function's ARN, which a publish does not
change, so the distribution stays out of the plan.

`.prettierignore` and `eslint.config.mjs` both skip the file. Terraform uploads it byte for byte, so reformatting
it would show up as a code change in the plan. The runtime is `cloudfront-js-2.0`, which supports
only part of modern JavaScript and has no network access, so check AWS's list of supported features
before using anything newer than what the file already uses. Before planning, run the old and new
versions side by side in `node` against a handful of paths.

## Before you plan

- Applies belong to the user. Run `terraform fmt`, `terraform validate` and `terraform plan`, show
  the plan, and stop there. Hand over the exact command, either `terraform apply <file>.tfplan` for a
  saved plan or a fresh `terraform plan` followed by `terraform apply`.
- `provider.tf` has no `default_tags`. Every resource came in through an import, and provider-wide
  tags would turn into an in-place change on each of them. Tag a resource in its own block.
- A distribution change takes several minutes to deploy, and `terraform apply` waits for it since
  `wait_for_deployment` defaults to true. A function change only publishes, so it returns in
  seconds.
- Replacing the distribution instead of updating it gives it a new ARN and a new `cloudfront.net`
  domain. The bucket policy names the ARN and the hand-made DNS records point at the domain, so the
  site goes dark. A plan that shows `-/+` on `aws_cloudfront_distribution.site` must not be applied
  as it stands.

## Importing on a fresh machine

State does not travel with the repo. On a checkout without `terraform.tfstate`:

```bash
cd terraform
terraform init
terraform import aws_cloudfront_function.redirect flexi-day-redirect
terraform import aws_cloudfront_origin_access_control.site E16SLUJTCTLL2C
terraform import aws_cloudfront_distribution.site EQG4OWS15ZIN7
terraform import aws_s3_bucket.site flexiday-frontend
terraform import aws_s3_bucket_policy.site flexiday-frontend
terraform import aws_s3_bucket_public_access_block.site flexiday-frontend
terraform import aws_s3_bucket_ownership_controls.site flexiday-frontend
terraform import aws_s3_bucket_server_side_encryption_configuration.site flexiday-frontend
terraform plan
```

The provider never reads `publish` back, so the first plan after importing the function shows
`+ publish = true` and nothing else. That apply only republishes the code LIVE already runs.
Accept it, or set `publish` to `true` in the state file through `terraform state pull` and
`terraform state push` so the plan comes out clean. Any other difference means the live
configuration has drifted from these files. Fix the files to match before changing anything.
