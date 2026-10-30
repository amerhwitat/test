terraform {
  required_version = ">= 1.6.0"
  required_providers {
    hcloud = { source = "hetznercloud/hcloud", version = "~> 1.49" }
  }
}

provider "hcloud" { token = var.hcloud_token }

resource "hcloud_ssh_key" "deploy" {
  name       = "${var.name}-deploy"
  public_key = var.ssh_public_key
}

resource "hcloud_firewall" "voiceconnect" {
  name = "${var.name}-firewall"
  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = var.admin_cidrs
  }
  dynamic "rule" {
    for_each = toset(["80", "443", "3478"])
    content {
      direction = "in"
      protocol  = "tcp"
      port      = rule.value
      source_ips = ["0.0.0.0/0", "::/0"]
    }
  }
  dynamic "rule" {
    for_each = toset(["80", "443", "3478", "49160-49200"])
    content {
      direction = "in"
      protocol  = "udp"
      port      = rule.value
      source_ips = ["0.0.0.0/0", "::/0"]
    }
  }
}

resource "hcloud_server" "voiceconnect" {
  name        = var.name
  image       = "ubuntu-24.04"
  server_type = var.server_type
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.deploy.id]
  firewall_ids = [hcloud_firewall.voiceconnect.id]
  user_data   = templatefile("${path.module}/cloud-init.yaml.tftpl", { deploy_user = var.deploy_user, ssh_public_key = var.ssh_public_key })
  labels = { app = "voiceconnect", managed_by = "terraform" }
}

output "server_ipv4" { value = hcloud_server.voiceconnect.ipv4_address }
output "server_ipv6" { value = hcloud_server.voiceconnect.ipv6_address }
output "server_name" { value = hcloud_server.voiceconnect.name }
