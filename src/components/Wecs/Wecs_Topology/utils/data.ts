import cm from "../../../../assets/k8s_resources_logo/cm.svg";
import crb from "../../../../assets/k8s_resources_logo/crb.svg";
import crd from "../../../../assets/k8s_resources_logo/crd.svg";
import cRole from "../../../../assets/k8s_resources_logo/c-role.svg";
import cronjob from "../../../../assets/k8s_resources_logo/cronjob.svg";
import deployicon from "../../../../assets/k8s_resources_logo/deploy.svg";
import ds from "../../../../assets/k8s_resources_logo/ds.svg";
import ep from "../../../../assets/k8s_resources_logo/ep.svg";
import group from "../../../../assets/k8s_resources_logo/group.svg";
import hpa from "../../../../assets/k8s_resources_logo/hpa.svg";
import ing from "../../../../assets/k8s_resources_logo/ing.svg";
import job from "../../../../assets/k8s_resources_logo/job.svg";
import limits from "../../../../assets/k8s_resources_logo/limits.svg";
import netpol from "../../../../assets/k8s_resources_logo/netpol.svg";
import ns from "../../../../assets/k8s_resources_logo/ns.svg";
import psp from "../../../../assets/k8s_resources_logo/psp.svg";
import pv from "../../../../assets/k8s_resources_logo/pv.svg";
import pvc from "../../../../assets/k8s_resources_logo/pvc.svg";
import quota from "../../../../assets/k8s_resources_logo/quota.svg";
import rb from "../../../../assets/k8s_resources_logo/rb.svg";
import role from "../../../../assets/k8s_resources_logo/role.svg";
import rs from "../../../../assets/k8s_resources_logo/rs.svg";
import sa from "../../../../assets/k8s_resources_logo/sa.svg";
import sc from "../../../../assets/k8s_resources_logo/sc.svg";
import secret from "../../../../assets/k8s_resources_logo/secret.svg";
import sts from "../../../../assets/k8s_resources_logo/sts.svg";
import svc from "../../../../assets/k8s_resources_logo/svc.svg";
import cluster from "../../../../assets/k8s_resources_logo/kubernetes-logo.svg";
import pod from "../../../../assets/k8s_resources_logo/pod.png";
import user from "../../../../assets/k8s_resources_logo/user.svg";
import vol from "../../../../assets/k8s_resources_logo/vol.svg";

export const nodeStyle: React.CSSProperties = {
  padding: "2px 12px",
  fontSize: "6px",
  border: "none",
  width: "146px",
  height: "30px",
};

export const iconMap: Record<string, string> = {
  ConfigMap: cm,
  ClusterRoleBinding: crb,
  CustomResourceDefinition: crd,
  ClusterRole: cRole,
  CronJob: cronjob,
  Deployment: deployicon,
  DaemonSet: ds,
  Endpoints: ep,
  Group: group,
  HorizontalPodAutoscaler: hpa,
  Ingress: ing,
  Job: job,
  LimitRange: limits,
  NetworkPolicy: netpol,
  Namespace: deployicon,
  PodSecurityPolicy: psp,
  PersistentVolume: pv,
  PersistentVolumeClaim: pvc,
  ResourceQuota: quota,
  RoleBinding: rb,
  Role: role,
  ReplicaSet: rs,
  ServiceAccount: sa,
  StorageClass: sc,
  Secret: secret,
  StatefulSet: sts,
  Service: svc,
  User: user,
  Volume: vol,
  Pod: deployicon,
  Cluster: group,
};

export const getNodeConfig = (type: string) => {
  const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  
  let icon = iconMap[normalizedType] || cm;
  let dynamicText = type.toLowerCase();

  switch (type.toLowerCase()) {
    case "cluster":
      icon = cluster;
      dynamicText = "cluster";
      break;
    case "namespace":
      icon = ns;
      dynamicText = "ns";
      break;
    case "pod":
      icon = pod;
      dynamicText = "pod";
      break;
    default:
      break;
  }

  return { icon, dynamicText };
};