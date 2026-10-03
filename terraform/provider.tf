terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# No default_tags: every resource here was imported from a hand-built original, and provider-wide
# tags would show up in the plan as an in-place change to each of them.
provider "aws" {
  region = var.aws_region
}
