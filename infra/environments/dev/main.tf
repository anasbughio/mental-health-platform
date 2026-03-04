module "networking" {
  source               = "../../modules/networking"
  project_name         = "mentalhealth-dev"
  vpc_cidr             = "10.0.0.0/16"
  public_subnet_cidr   = "10.0.1.0/24"
  availability_zone    = "us-east-1a"
}

module "compute" {
  source               = "../../modules/compute"
  project_name         = "mentalhealth-dev"
  vpc_id               = module.networking.vpc_id
  public_subnet_id     = module.networking.public_subnet_id
  instance_type        = "t3.micro"
  key_name             = "my-aws-keypair"    # Make sure this key pair exists in AWS!
  admin_ip             = "59.103.119.62/32" # E.g., "203.0.113.50/32"
}

module "frontend" {
  source               = "../../modules/frontend"
  project_name         = "mentalhealth-platform"
  bucket_name          = "mental-health-platform"
}