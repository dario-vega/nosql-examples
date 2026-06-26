variable region {  }
variable compartment_ocid {  }
variable "tenancy_ocid" {}

variable "ssh_source_cidr" {
  default = "10.0.0.0/16"
}

variable "demo_app_source_cidr" {
  default = "10.0.0.0/16"
}

variable "ocir_repo_name" {
  default = "demonosql"
}

variable "always_free" {
  default = "false"
}

variable "ocir_user_name" {
  default = ""
}

variable "ocir_user_password" {
  default = ""
}

# OCIR repo name & namespace

locals {
  ocir_docker_repository = join("", [lower(lookup(data.oci_identity_regions.oci_regions.regions[0], "key" )), ".ocir.io"])
  ocir_namespace = lookup(data.oci_objectstorage_namespace.test_namespace, "namespace" )
}
