variable "aws_region" {
  description = "Region of the site bucket. CloudFront itself is global."
  type        = string
  default     = "eu-central-1"
}

variable "site_bucket_name" {
  description = "S3 bucket the static export is synced into by the deploy job in .github/workflows/ci.yml"
  type        = string
  default     = "flexiday-frontend"
}

variable "aliases" {
  description = "Hostnames the distribution answers. The redirect function sends the apex to www."
  type        = list(string)
  default     = ["www.flexi-day.com", "flexi-day.com"]
}

variable "acm_certificate_arn" {
  description = "ACM certificate covering the aliases. CloudFront only accepts certificates from us-east-1; it was issued by hand and is referenced, not managed."
  type        = string
  default     = "arn:aws:acm:us-east-1:111009055163:certificate/0f7899c1-82b7-4802-8af3-dc9c7ef0a384"
}

variable "web_acl_arn" {
  description = "WAF web ACL CloudFront created for the distribution. Referenced, not managed."
  type        = string
  default     = "arn:aws:wafv2:us-east-1:111009055163:global/webacl/CreatedByCloudFront-30adef93/34ef4202-0537-4e2b-8a02-0077c67ba7e1"
}
