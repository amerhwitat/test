variable "hcloud_token" { type = string, sensitive = true }
variable "ssh_public_key" { type = string }
variable "admin_cidrs" { type = list(string), description = "SSH source CIDRs; use your fixed public IP /32 or IPv6 /128." }
variable "name" { type = string, default = "voiceconnect-prod" }
variable "server_type" { type = string, default = "cx23" }
variable "location" { type = string, default = "fsn1" }
variable "deploy_user" { type = string, default = "voiceconnect" }
