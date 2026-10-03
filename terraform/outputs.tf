output "redirect_function_arn" {
  description = "Viewer-request function on the distribution's default behaviour"
  value       = aws_cloudfront_function.redirect.arn
}

output "distribution_id" {
  description = "Value of the CLOUDFRONT_DISTRIBUTION_ID repository variable the deploy job invalidates"
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_domain_name" {
  description = "Target of the flexi-day.com and www.flexi-day.com alias records in Route 53"
  value       = aws_cloudfront_distribution.site.domain_name
}

output "site_bucket_name" {
  description = "Value of the AWS_S3_BUCKET repository variable the deploy job syncs into"
  value       = aws_s3_bucket.site.bucket
}
