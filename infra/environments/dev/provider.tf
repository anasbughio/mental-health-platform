terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Your Remote State Configuration
  backend "s3" {
    bucket         = "mental-health-platform-frontend" # Must create this manually first!
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "mental-health"         # Must create this manually first!
    encrypt        = true
  }
}

provider "aws" {
  region = "us-east-1"
}