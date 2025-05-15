import { useState, useEffect, useCallback, useRef, memo } from "react";
import { Box, Typography, Menu, MenuItem, Button, IconButton } from "@mui/material";
import { ReactFlowProvider, Position, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { Plus } from "lucide-react";
import CreateOptions from "../../CreateOptions";
import { NodeLabel } from "../../Wds_Topology/NodeLabel";
import { ZoomControls } from "../../Wds_Topology/ZoomControls";
import LoadingFallback from "../../LoadingFallback";
import ReactDOM from "react-dom";
import { isEqual } from "lodash";
import { useWebSocket } from "../../../context/WebSocketProvider";
import useTheme from "../../../stores/themeStore";
import WecsDetailsPanel from "../WecsDetailsPanel/WecsDetailsPanel";
import { FlowCanvas } from "../../Wds_Topology/FlowCanvas";
import ListViewComponent from "../../ListViewComponent";
import { getNodeConfig, nodeStyle } from "./utils/data";
import getLayoutedElements from "./utils/getLayoutedElements";

// Updated Interfaces
export interface NodeData {
  label: JSX.Element;
}

export interface BaseNode {
  id: string;
  data: NodeData;
  position: { x: number; y: number };
  style?: React.CSSProperties;
}

export interface CustomNode extends BaseNode {
  sourcePosition?: Position;
  targetPosition?: Position;
  collapsed?: boolean;
  showMenu?: boolean;
}

export interface BaseEdge {
  id: string;
  source: string;
  target: string;
}

export interface CustomEdge extends BaseEdge {
  type?: string;
  animated?: boolean;
  style?: React.CSSProperties;
  markerEnd?: {
    type: MarkerType;
    width?: number;
    height?: number;
    color?: string;
  };
}

export interface ResourceItem {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    creationTimestamp: string;
    labels?: Record<string, string>;
    uid?: string;
    [key: string]: string | undefined | Record<string, string>;
  };
  spec?: {
    ports?: Array<{ name: string; port: number }>;
    holderIdentity?: string;
    replicas?: number;
    scaleTargetRef?: {
      apiVersion?: string;
      kind?: string;
      name?: string;
    };
  };
  status?: {
    conditions?: Array<{ type: string; status: string }>;
    phase?: string;
  };
  data?: Record<string, string>;
  subsets?: Array<{
    addresses?: Array<{ ip: string }>;
    ports?: Array<{ name?: string; port?: number }>;
  }>;
  endpoints?: Array<{
    addresses?: string[];
    ports?: Array<{ name?: string; port?: number }>;
  }>;
  ports?: Array<{ name: string; port: number }>;
  subjects?: Array<{ name: string }>;
  roleRef?: { name: string };
  rules?: Array<{
    verbs?: string[];
    resources?: string[];
  }>;
}

export interface WecsResource {
  name: string;
  raw: ResourceItem;
  replicaSets?: Array<{
    name: string;
    kind: string;
    raw: ResourceItem;
    pods?: Array<{
      name: string;
      kind: string;
      raw: ResourceItem;
      creationTimestamp?: string;
    }>;
    creationTimestamp?: string;
  }>;
  pods?: Array<{
    name: string;
    kind: string;
    raw: ResourceItem;
    creationTimestamp?: string;
  }>;
}

export interface WecsResourceType {
  kind: string;
  version: string;
  resources: WecsResource[];
}

export interface WecsNamespace {
  namespace: string;
  resourceTypes: WecsResourceType[];
}

export interface WecsCluster {
  cluster: string;
  namespaces: WecsNamespace[];
}

interface SelectedNode {
  namespace: string;
  name: string;
  type: string;
  onClose: () => void;
  isOpen: boolean;
  resourceData?: ResourceItem;
  initialTab?: number;
  cluster?: string;
}

interface ContextMenuState {
  nodeId: string | null;
  x: number;
  y: number;
  nodeType: string | null;
}

const WecsTreeview = () => {
  const theme = useTheme((state) => state.theme);
  const [nodes, setNodes] = useState<CustomNode[]>([]);
  const [edges, setEdges] = useState<CustomEdge[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const [activeOption, setActiveOption] = useState<string | null>("option1");
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [isTransforming, setIsTransforming] = useState<boolean>(false);
  const [dataReceived, setDataReceived] = useState<boolean>(false);
  const [minimumLoadingTimeElapsed, setMinimumLoadingTimeElapsed] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const nodeCache = useRef<Map<string, CustomNode>>(new Map());
  const edgeCache = useRef<Map<string, CustomEdge>>(new Map());
  const edgeIdCounter = useRef<number>(0);
  const prevNodes = useRef<CustomNode[]>([]);
  const renderStartTime = useRef<number>(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevWecsData = useRef<WecsCluster[] | null>(null);
  const stateRef = useRef({ isCollapsed, isExpanded });
  const [viewMode, setViewMode] = useState<'tiles' | 'list'>('tiles');

  const { wecsIsConnected, hasValidWecsData, wecsData } = useWebSocket();

  useEffect(() => {
    renderStartTime.current = performance.now();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumLoadingTimeElapsed(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (wecsData !== null && !dataReceived) {
      setDataReceived(true);
    }
  }, [wecsData, dataReceived]);

  useEffect(() => {
    stateRef.current = { isCollapsed, isExpanded };
  }, [isCollapsed, isExpanded]);

  const getTimeAgo = useCallback((timestamp: string | undefined): string => {
    if (!timestamp) return "Unknown";
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? "Today" : `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }, []);

  const handleMenuOpen = useCallback((event: React.MouseEvent, nodeId: string) => {
    event.preventDefault();
    event.stopPropagation();
    let nodeType: string | null = null;
    if (nodeId.includes(":")) {
      const nodeIdParts = nodeId.split(":");
      nodeType = nodeIdParts[0];
    }
    setContextMenu({ nodeId, x: event.clientX, y: event.clientY, nodeType });
  }, []);

  const handleClosePanel = useCallback(() => {
    if (selectedNode) {
      setSelectedNode({ ...selectedNode, isOpen: false });
      setTimeout(() => setSelectedNode(null), 400);
    }
  }, [selectedNode]);

  const createNode = useCallback(
    (
      id: string,
      label: string,
      type: string,
      status: string,
      timestamp: string | undefined,
      namespace: string | undefined,
      resourceData: ResourceItem | undefined,
      parent: string | null,
      newNodes: CustomNode[],
      newEdges: CustomEdge[]
    ) => {
      const config = getNodeConfig(type.toLowerCase());
      const timeAgo = getTimeAgo(timestamp);
      const cachedNode = nodeCache.current.get(id);

      const node =
        cachedNode ||
        ({
          id,
          data: {
            label: (
              <NodeLabel
                label={label}
                icon={config.icon}
                dynamicText={config.dynamicText}
                status={status}
                timeAgo={timeAgo}
                resourceData={resourceData}
                onClick={(e) => {
                  if ((e.target as HTMLElement).tagName === "svg" || (e.target as HTMLElement).closest("svg")) return;
                  if (type.toLowerCase() === "namespace") return;
                  const nodeIdParts = id.split(":");
                  let cluster = "";
                  if (type.toLowerCase() === "cluster" && nodeIdParts.length === 2) {
                    cluster = nodeIdParts[1];
                  } else if (type.toLowerCase() === "namespace" && nodeIdParts.length === 3) {
                    cluster = nodeIdParts[1];
                  } else if (nodeIdParts.length >= 4) {
                    cluster = nodeIdParts[1];
                  }
                  setSelectedNode({
                    namespace: namespace || "default",
                    name: label,
                    type: type.toLowerCase(),
                    onClose: handleClosePanel,
                    isOpen: true,
                    resourceData,
                    cluster,
                  });
                }}
                onMenuClick={(e) => handleMenuOpen(e, id)}
              />
            ),
          },
          position: { x: 0, y: 0 },
          style: {
            ...nodeStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "2px 12px",
            backgroundColor: theme === "dark" ? "#333" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
          },
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
        } as CustomNode);

      if (!cachedNode) nodeCache.current.set(id, node);
      newNodes.push(node);

      if (parent && stateRef.current.isExpanded) {
        const uniqueSuffix = resourceData?.metadata?.uid || edgeIdCounter.current++;
        const edgeId = `edge-${parent}-${id}-${uniqueSuffix}`;
        const cachedEdge = edgeCache.current.get(edgeId);
        if (!cachedEdge) {
          const edge = {
            id: edgeId,
            source: parent,
            target: id,
            type: "step",
            animated: true,
            style: { stroke: theme === "dark" ? "#ccc" : "#a3a3a3", strokeDasharray: "2,2" },
            markerEnd: { type: MarkerType.ArrowClosed, color: theme === "dark" ? "#ccc" : "#a3a3a3" },
          };
          newEdges.push(edge);
          edgeCache.current.set(edgeId, edge);
        } else {
          newEdges.push(cachedEdge);
        }
      }
    },
    [getTimeAgo, handleClosePanel, handleMenuOpen, theme]
  );

  const transformDataToTree = useCallback(
    (data: WecsCluster[]) => {
      if (!data || !Array.isArray(data) || data.length === 0) {
        ReactDOM.unstable_batchedUpdates(() => {
          setNodes([]);
          setEdges([]);
          setIsTransforming(false);
        });
        return;
      }

      const newNodes: CustomNode[] = [];
      const newEdges: CustomEdge[] = [];

      if (!stateRef.current.isExpanded) {
        data.forEach((cluster) => {
          const clusterId = `cluster:${cluster.cluster}`;
          createNode(
            clusterId,
            cluster.cluster,
            "cluster",
            "Active",
            "",
            undefined,
            { apiVersion: "v1", kind: "Cluster", metadata: { name: cluster.cluster, namespace: "", creationTimestamp: "" }, status: { phase: "Active" } },
            null,
            newNodes,
            newEdges
          );
        });
      } else {
        data.forEach((cluster) => {
          const clusterId = `cluster:${cluster.cluster}`;
          createNode(
            clusterId,
            cluster.cluster,
            "cluster",
            "Active",
            "",
            undefined,
            { apiVersion: "v1", kind: "Cluster", metadata: { name: cluster.cluster, namespace: "", creationTimestamp: "" }, status: { phase: "Active" } },
            null,
            newNodes,
            newEdges
          );

          if (cluster.namespaces && Array.isArray(cluster.namespaces)) {
            cluster.namespaces.forEach((namespace) => {
              const namespaceId = `ns:${cluster.cluster}:${namespace.namespace}`;
              createNode(
                namespaceId,
                namespace.namespace,
                "namespace",
                "Active",
                "",
                namespace.namespace,
                { apiVersion: "v1", kind: "Namespace", metadata: { name: namespace.namespace, namespace: namespace.namespace, creationTimestamp: "" }, status: { phase: "Active" } },
                clusterId,
                newNodes,
                newEdges
              );

              if (namespace.resourceTypes && Array.isArray(namespace.resourceTypes)) {
                if (stateRef.current.isCollapsed) {
                  const resourceGroups: Record<string, ResourceItem[]> = {};

                  namespace.resourceTypes.forEach((resourceType) => {
                    // Skip Event type resources
                    if (resourceType.kind.toLowerCase() === "event") return;
                    
                    resourceType.resources.forEach((resource) => {
                      const kindLower = resourceType.kind.toLowerCase();
                      if (!resourceGroups[kindLower]) {
                        resourceGroups[kindLower] = [];
                      }
                      resourceGroups[kindLower].push(resource.raw);
                    });
                  });

                  Object.entries(resourceGroups).forEach(([kindLower, items]) => {
                    const count = items.length;
                    const groupId = `ns:${cluster.cluster}:${namespace.namespace}:${kindLower}:group`;
                    const status = items.some(item => item.status?.phase === "Running") ? "Active" : "Inactive";
                    const label = `${count} ${kindLower}${count !== 1 ? "s" : ""}`;

                    createNode(
                      groupId,
                      label,
                      kindLower,
                      status,
                      items[0]?.metadata.creationTimestamp,
                      namespace.namespace,
                      items[0],
                      namespaceId,
                      newNodes,
                      newEdges
                    );
                  });
                } else {
                  // Process all resource types for the expanded view
                  // First collect all ReplicaSet names that are children of deployments
                  const childReplicaSets = new Set<string>();
                  
                  namespace.resourceTypes.forEach((resourceType) => {
                    if (resourceType.kind.toLowerCase() === "deployment") {
                      resourceType.resources.forEach((resource) => {
                        if (resource && resource.replicaSets && Array.isArray(resource.replicaSets)) {
                          resource.replicaSets.forEach((rs) => {
                            if (rs && rs.name) {
                              childReplicaSets.add(rs.name);
                            }
                          });
                        }
                      });
                    }
                  });
                  
                  // Now process all resources while filtering ReplicaSets that are children
                  namespace.resourceTypes.forEach((resourceType) => {
                    // Skip Event type resources
                    if (resourceType.kind.toLowerCase() === "event") return;
                    
                    const kindLower = resourceType.kind.toLowerCase();
                    
                    resourceType.resources.forEach((resource, index) => {
                      if (!resource || typeof resource !== "object" || !resource.raw) return;
                      const rawResource = resource.raw;
                      if (!rawResource.metadata || typeof rawResource.metadata !== "object" || !rawResource.metadata.name) return;
                      
                      // Skip ReplicaSets that are already children of Deployments
                      if (kindLower === "replicaset" && childReplicaSets.has(rawResource.metadata.name)) {
                        return;
                      }

                      const resourceId = `${kindLower}:${cluster.cluster}:${namespace.namespace}:${rawResource.metadata.name}:${index}`;
                      const status = rawResource.status?.phase || "Active";
                      createNode(
                        resourceId,
                        rawResource.metadata.name,
                        kindLower,
                        status,
                        rawResource.metadata.creationTimestamp,
                        namespace.namespace,
                        rawResource,
                        namespaceId,
                        newNodes,
                        newEdges
                      );

                      if (kindLower === "deployment" && rawResource.spec) {
                        if (resource.replicaSets && Array.isArray(resource.replicaSets)) {
                          resource.replicaSets.forEach((rs, rsIndex) => {
                            const replicaSetId = `replicaset:${cluster.cluster}:${namespace.namespace}:${rs.name}:${rsIndex}`;
                            createNode(
                              replicaSetId,
                              rs.name,
                              "replicaset",
                              rs.raw.status?.phase || status,
                              rs.raw.metadata.creationTimestamp,
                              namespace.namespace,
                              rs.raw,
                              resourceId,
                              newNodes,
                              newEdges
                            );
                            if (rs.pods && Array.isArray(rs.pods)) {
                              rs.pods.forEach((pod, podIndex) => {
                                const podId = `pod:${cluster.cluster}:${namespace.namespace}:${pod.name}:${podIndex}`;
                                createNode(
                                  podId,
                                  pod.name,
                                  "pod",
                                  pod.raw.status?.phase || status,
                                  pod.raw.metadata.creationTimestamp,
                                  namespace.namespace,
                                  pod.raw,
                                  replicaSetId,
                                  newNodes,
                                  newEdges
                                );
                              });
                            }
                          });
                        }
                      } else if (kindLower === "replicaset" && rawResource.spec) {
                        if (resource.replicaSets && Array.isArray(resource.replicaSets) && resource.replicaSets.length > 0) {
                          const pods = resource.replicaSets[0].pods;
                          if (pods && Array.isArray(pods)) {
                            pods.forEach((pod, podIndex) => {
                              const podId = `pod:${cluster.cluster}:${namespace.namespace}:${pod.name}:${podIndex}`;
                              createNode(
                                podId,
                                pod.name,
                                "pod",
                                pod.raw.status?.phase || status,
                                pod.raw.metadata.creationTimestamp,
                                namespace.namespace,
                                pod.raw,
                                resourceId,
                                newNodes,
                                newEdges
                              );
                            });
                          }
                        }
                      } else if (kindLower === "statefulset" && rawResource.spec) {
                        // Display actual pods from the data
                        if (resource.pods && Array.isArray(resource.pods)) {
                          resource.pods.forEach((pod, podIndex) => {
                            const podId = `pod:${cluster.cluster}:${namespace.namespace}:${pod.name}:${podIndex}`;
                          createNode(
                            podId,
                              pod.name,
                            "pod",
                              pod.raw.status?.phase || status,
                              pod.raw.metadata.creationTimestamp,
                            namespace.namespace,
                              pod.raw,
                            resourceId,
                            newNodes,
                            newEdges
                          );
                          });
                        }
                      } else if (kindLower === "daemonset" && rawResource.spec) {
                        // Display actual pods from the data
                        if (resource.pods && Array.isArray(resource.pods)) {
                          resource.pods.forEach((pod, podIndex) => {
                            const podId = `pod:${cluster.cluster}:${namespace.namespace}:${pod.name}:${podIndex}`;
                          createNode(
                            podId,
                              pod.name,
                            "pod",
                              pod.raw.status?.phase || status,
                              pod.raw.metadata.creationTimestamp,
                            namespace.namespace,
                              pod.raw,
                            resourceId,
                            newNodes,
                            newEdges
                          );
                          });
                        }
                      } else if (kindLower === "replicationcontroller" && rawResource.spec) {
                        // Display actual pods from the data
                        if (resource.pods && Array.isArray(resource.pods)) {
                          resource.pods.forEach((pod, podIndex) => {
                            const podId = `pod:${cluster.cluster}:${namespace.namespace}:${pod.name}:${podIndex}`;
                          createNode(
                            podId,
                              pod.name,
                            "pod",
                              pod.raw.status?.phase || status,
                              pod.raw.metadata.creationTimestamp,
                            namespace.namespace,
                              pod.raw,
                            resourceId,
                            newNodes,
                            newEdges
                          );
                          });
                        }
                      } else if (kindLower === "cronjob" && rawResource.spec) {
                        // Display actual jobs and pods from the data if they exist
                        // No hardcoding
                      } else if (kindLower === "job" && rawResource.spec) {
                        // Display actual pods from the data
                        if (resource.pods && Array.isArray(resource.pods)) {
                          resource.pods.forEach((pod, podIndex) => {
                            const podId = `pod:${cluster.cluster}:${namespace.namespace}:${pod.name}:${podIndex}`;
                        createNode(
                          podId,
                              pod.name,
                          "pod",
                              pod.raw.status?.phase || status,
                              pod.raw.metadata.creationTimestamp,
                          namespace.namespace,
                              pod.raw,
                          resourceId,
                          newNodes,
                          newEdges
                        );
                          });
                        }
                      } else if (kindLower === "service" && rawResource.spec) {
                        // Only show the Service without creating endpoints automatically
                        // Endpoints will be shown if they exist in the actual data
                      } else if (kindLower === "ingress" && rawResource.spec) {
                        // Only show the Ingress without creating services automatically
                        // Services will be shown if they exist in the actual data
                      } else if (kindLower === "configmap" || kindLower === "secret") {
                        // Only show the ConfigMap/Secret without creating volumes automatically
                        // Volumes will be shown if they exist in the actual data
                      } else if (kindLower === "persistentvolumeclaim" && rawResource.spec) {
                        // Only show the PVC without creating a PV automatically
                      } else if (kindLower === "storageclass" && rawResource.spec) {
                        // Only show the StorageClass without creating a PV automatically
                      } else if (kindLower === "horizontalpodautoscaler" && rawResource.spec) {
                        // Only show the HPA without creating target resources automatically
                        // Target resources will be shown if they exist in the actual data
                      } else if (kindLower === "rolebinding" && rawResource.roleRef) {
                        // Only show the RoleBinding without creating roles automatically
                        // Roles will be shown if they exist in the actual data
                      } else if (kindLower === "clusterrolebinding" && rawResource.roleRef) {
                        // Only show the ClusterRoleBinding without creating cluster roles automatically
                        // ClusterRoles will be shown if they exist in the actual data
                      } else if (kindLower === "poddisruptionbudget" && rawResource.spec) {
                        // Intentionally empty
                      } else if (kindLower === "networkpolicy" && rawResource.spec) {
                        // Intentionally empty
                      } else if (kindLower === "ingressclass" || kindLower === "mutatingwebhookconfiguration" || kindLower === "validatingwebhookconfiguration") {
                        // Intentionally empty
                      }
                    });
                  });
                }
              }
            });
          }
        });
      }

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges, "LR", prevNodes);
      ReactDOM.unstable_batchedUpdates(() => {
        if (!isEqual(nodes, layoutedNodes)) setNodes(layoutedNodes);
        if (!isEqual(edges, layoutedEdges)) setEdges(layoutedEdges);
        setIsTransforming(false);
      });
      prevNodes.current = layoutedNodes;
    },
    [createNode, nodes, edges]
  );

  useEffect(() => {
    if (wecsData !== null && !isEqual(wecsData, prevWecsData.current)) {
      setIsTransforming(true);
      transformDataToTree(wecsData as WecsCluster[]);
      prevWecsData.current = wecsData as WecsCluster[];
    }
  }, [wecsData, transformDataToTree]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedNode?.isOpen && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        handleClosePanel();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedNode, handleClosePanel]);

  const handleMenuClose = useCallback(() => setContextMenu(null), []);

  const handleMenuAction = useCallback(
    async (action: string) => {
      if (contextMenu?.nodeId) {
        const node = nodes.find((n) => n.id === contextMenu.nodeId);
        if (node) {
          const nodeIdParts = node.id.split(":");
          const nodeName = node.data.label.props.label;
          let namespace = "";
          let nodeType = "";
          let cluster = "";

          if (node.id.startsWith("cluster:") && nodeIdParts.length === 2) {
            nodeType = "cluster";
            namespace = "";
            cluster = nodeIdParts[1];
          } else if (node.id.startsWith("ns:") && nodeIdParts.length === 3) {
            nodeType = "namespace";
            namespace = nodeIdParts[2];
            cluster = nodeIdParts[1];
          } else if (nodeIdParts.length >= 4) {
            nodeType = "pod";
            namespace = nodeIdParts[2];
            cluster = nodeIdParts[1];
          } else {
            return;
          }

          const resourceData = node.data.label.props.resourceData;

          switch (action) {
            case "Details":
              setSelectedNode({
                namespace: namespace || "default",
                name: nodeName,
                type: nodeType,
                onClose: handleClosePanel,
                isOpen: true,
                resourceData,
                initialTab: 0,
                cluster,
              });
              break;
            case "Edit":
              setSelectedNode({
                namespace: namespace || "default",
                name: nodeName,
                type: nodeType,
                onClose: handleClosePanel,
                isOpen: true,
                resourceData,
                initialTab: 1,
                cluster,
              });
              break;
            case "Logs":
              setSelectedNode({
                namespace: namespace || "default",
                name: nodeName,
                type: nodeType,
                onClose: handleClosePanel,
                isOpen: true,
                resourceData,
                initialTab: 2,
                cluster,
              });
              break;
            default:
              break;
          }
        }
      }
      handleMenuClose();
    },
    [contextMenu, nodes, handleClosePanel, handleMenuClose]
  );

  const handleCancelCreateOptions = () => setShowCreateOptions(false);

  const handleCreateWorkloadClick = () => {
    setShowCreateOptions(true);
    setActiveOption("option1");
  };

  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const newCollapsed = !prev;
      stateRef.current.isCollapsed = newCollapsed;
      setIsTransforming(true);
      transformDataToTree(wecsData as WecsCluster[]);
      return newCollapsed;
    });
  }, [wecsData, transformDataToTree]);

  const handleExpandAll = useCallback(() => {
    setIsExpanded(() => {
      const newExpanded = true;
      stateRef.current.isExpanded = newExpanded;
      setIsTransforming(true);
      transformDataToTree(wecsData as WecsCluster[]);
      return newExpanded;
    });
  }, [wecsData, transformDataToTree]);

  const handleCollapseAll = useCallback(() => {
    setIsExpanded(() => {
      const newExpanded = false;
      stateRef.current.isExpanded = newExpanded;
      setIsTransforming(true);
      transformDataToTree(wecsData as WecsCluster[]);
      return newExpanded;
    });
  }, [wecsData, transformDataToTree]);

  const isLoading = !wecsIsConnected || !hasValidWecsData || isTransforming || !minimumLoadingTimeElapsed;

  return (
    <Box sx={{ display: "flex", height: "85vh", width: "100%", position: "relative" }}>
      <Box
        sx={{
          flex: 1,
          position: "relative",
          filter: selectedNode?.isOpen ? "blur(5px)" : "none",
          transition: "filter 0.2s ease-in-out",
          pointerEvents: selectedNode?.isOpen ? "none" : "auto",
        }}
      >
        <Box
          sx={{
            mb: 4,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flex: 1,
            justifyContent: "space-between",
            padding: 2,
            borderRadius: 1,
            boxShadow: "0 6px 6px rgba(0,0,0,0.1)",
            background: theme === "dark" ? "rgb(15, 23, 42)" : "#fff",
          }}
        >
          <Typography variant="h4" sx={{ color: "#4498FF", fontWeight: 700, fontSize: "30px", letterSpacing: "0.5px" }}>
            Remote-Cluster Treeview
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              color={viewMode === 'tiles' ? "primary" : "default"}
              onClick={() => setViewMode('tiles')}
              sx={{ 
                padding: 1,
                borderRadius: "50%",
                width: 40,
                height: 40,
                bgcolor: theme === "dark" && viewMode === 'tiles' ? "rgba(144, 202, 249, 0.15)" : "transparent",
                "&:hover": {
                  bgcolor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                }
              }}
            >
              <span>
                <i 
                  className="fa fa-th menu_icon" 
                  title="Tiles"
                  style={{ 
                    color: theme === "dark" 
                      ? viewMode === 'tiles' ? "#90CAF9" : "#FFFFFF" 
                      : undefined 
                  }}
                ></i>
              </span>
            </IconButton>
            <IconButton
              color={viewMode === 'list' ? "primary" : "default"}
              onClick={() => setViewMode('list')}
              sx={{ 
                padding: 1,
                borderRadius: "50%", 
                width: 40,         
                height: 40,         
              
                bgcolor: theme === "dark" && viewMode === 'list' ? "rgba(144, 202, 249, 0.15)" : "transparent",
                "&:hover": {
                  bgcolor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
                }
              }}
            >
              <span>
                <i 
                  className="fa fa-th-list menu_icon" 
                  title="List"
                  style={{ 
                    color: theme === "dark" 
                      ? viewMode === 'list' ? "#90CAF9" : "#FFFFFF" 
                      : undefined 
                  }}
                ></i>
              </span>
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<Plus size={20} />}
              onClick={handleCreateWorkloadClick}
              sx={{
                color: "#FFFFFF",
                backgroundColor: "#2F86FF",
                padding: "8px 20px",
                fontWeight: "600",
                borderRadius: "8px",
                textTransform: "none",
              }}
            >
              Create Workload
            </Button>
          </Box>
        </Box>

        {showCreateOptions && <CreateOptions activeOption={activeOption} setActiveOption={setActiveOption} onCancel={handleCancelCreateOptions} />}

        <Box 
          sx={{ 
            width: "100%", 
            padding: "8px 16px",
            backgroundColor: theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
            borderRadius: "4px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center"
          }}
        >
          <Typography variant="body2" sx={{ color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.6)" }}>
            Note: Default, Kubernetes system, and OpenShift namespaces are filtered out from this view.
          </Typography>
        </Box>

        <Box sx={{ width: "100%", height: "calc(100% - 80px)", position: "relative" }}>
          {isLoading ? (
            <LoadingFallback message="Loading the tree..." size="medium" />
          ) : viewMode === 'list' ? (
            <ListViewComponent />
          ) : nodes.length > 0 || edges.length > 0 ? (
            <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
              <ReactFlowProvider>
                <FlowCanvas nodes={nodes} edges={edges} renderStartTime={renderStartTime} theme={theme} />
                <ZoomControls theme={theme} onToggleCollapse={handleToggleCollapse} isCollapsed={isCollapsed} onExpandAll={handleExpandAll} onCollapseAll={handleCollapseAll} />
              </ReactFlowProvider>
            </Box>
          ) : (
            <Box
              sx={{
                width: "100%",
                backgroundColor: theme === "dark" ? "var(--fallback-b1,oklch(var(--b1)/var(--tw-bg-opacity)))" : "#fff",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                marginTop: "250px",
              }}
            >
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <Typography sx={{ color: theme === "dark" ? "#fff" : "#333", fontWeight: 500, fontSize: "22px" }}>
                  No Workloads Found
                </Typography>
                <Typography variant="body2" sx={{ color: "#00000099", fontSize: "17px", mb: 2 }}>
                  Get started by creating your first workload
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Plus size={20} />}
                  onClick={handleCreateWorkloadClick}
                  sx={{ backgroundColor: "#2f86ff", color: "#fff", "&:hover": { backgroundColor: "#1f76e5" } }}
                >
                  Create Workload
                </Button>
              </Box>
            </Box>
          )}

          {contextMenu && (
            <Menu
              open={Boolean(contextMenu)}
              onClose={handleMenuClose}
              anchorReference="anchorPosition"
              anchorPosition={contextMenu ? { top: contextMenu.y, left: contextMenu.x } : undefined}
            >
              <MenuItem onClick={() => handleMenuAction("Details")}>Details</MenuItem>
              <MenuItem onClick={() => handleMenuAction("Edit")}>Edit</MenuItem>
              {contextMenu.nodeType !== "cluster" && (
                <MenuItem onClick={() => handleMenuAction("Logs")}>Logs</MenuItem>
              )}
            </Menu>
          )}
        </Box>
      </Box>

      <div ref={panelRef}>
        <WecsDetailsPanel
          namespace={selectedNode?.namespace || ""}
          name={selectedNode?.name || ""}
          type={selectedNode?.type || ""}
          resourceData={selectedNode?.resourceData}
          onClose={handleClosePanel}
          isOpen={selectedNode?.isOpen || false}
          initialTab={selectedNode?.initialTab}
          cluster={selectedNode?.cluster || ""}
        />
      </div>
    </Box>
  );
};

export default memo(WecsTreeview);
