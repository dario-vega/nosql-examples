variable region {  }
variable compartment_ocid {  }
variable "tenancy_ocid" {}

variable "ssh_source_cidr" {
  default = "10.0.0.0/16"
}

variable "demo_app_source_cidr" {
  default = "10.0.0.0/16"
}
