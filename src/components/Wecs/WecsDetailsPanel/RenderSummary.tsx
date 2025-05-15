import { TableBody, TableRow, TableCell, Chip, Box, Table } from "@mui/material";
import { ClusterDetails, ResourceInfo } from "./WecsDetailsPanel";
import { ResourceItem } from "../../TreeViewComponent";

interface RenderSummaryProps {
    type: string;
    clusterDetails: ClusterDetails | null;
    calculateAge: (creationTime: string) => string;
    theme: string;
    resource: ResourceInfo | null;
    resourceData: ResourceItem | undefined
}


const RenderSummary = ({ type, clusterDetails, calculateAge, theme, resource, resourceData }: RenderSummaryProps) => {
    if (type.toLowerCase() === "cluster" && clusterDetails) {
        // Render cluster-specific information
        const clusterInfo = clusterDetails.itsManagedClusters && clusterDetails.itsManagedClusters.length > 0
            ? clusterDetails.itsManagedClusters[0]
            : null;

        return (
            <Box>
                <Table sx={{ borderRadius: 1, mb: 2 }}>
                    <TableBody>
                        {[
                            { label: "KIND", value: "Cluster" },
                            { label: "NAME", value: clusterDetails.clusterName },
                            { label: "CONTEXT", value: clusterInfo?.context || "Unknown" },
                            { label: "CREATED AT", value: clusterInfo ? `${new Date(clusterInfo.creationTime).toLocaleString()} (${calculateAge(clusterInfo.creationTime)})` : "Unknown" },
                        ].map((row, index) => (
                            <TableRow key={index}>
                                <TableCell
                                    sx={{
                                        borderBottom: theme === "dark" ? "1px solid #444" : "1px solid #e0e0e0",
                                        color: theme === "dark" ? "#D4D4D4" : "#333333",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        width: '150px',
                                        padding: '10px 16px'
                                    }}
                                >
                                    {row.label}
                                </TableCell>
                                <TableCell
                                    sx={{
                                        borderBottom: theme === "dark" ? "1px solid #444" : "1px solid #e0e0e0",
                                        color: theme === "dark" ? "#D4D4D4" : "#333333",
                                        fontSize: "14px",
                                        padding: '10px 16px'
                                    }}
                                >
                                    {row.value}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Display cluster labels if available */}
                {clusterInfo && clusterInfo.labels && Object.keys(clusterInfo.labels).length > 0 && (
                    <Table sx={{ borderRadius: 1 }}>
                        <TableBody>
                            <TableRow>
                                <TableCell
                                    sx={{
                                        borderBottom: theme === "dark" ? "1px solid #444" : "1px solid #e0e0e0",
                                        color: theme === "dark" ? "#D4D4D4" : "#333333",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        width: '150px',
                                        padding: '10px 16px',
                                        verticalAlign: 'top'
                                    }}
                                >
                                    LABELS
                                </TableCell>
                                <TableCell
                                    sx={{
                                        borderBottom: theme === "dark" ? "1px solid #444" : "1px solid #e0e0e0",
                                        color: theme === "dark" ? "#D4D4D4" : "#333333",
                                        fontSize: "14px",
                                        padding: '10px 16px'
                                    }}
                                >
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {clusterInfo.labels && Object.entries(clusterInfo.labels).map(([key, value], index) => (
                                            <Chip
                                                key={index}
                                                label={`${key}: ${value}`}
                                                size="small"
                                                sx={{
                                                    mr: 1,
                                                    mb: 1,
                                                    backgroundColor: theme === "dark" ? "#334155" : undefined,
                                                    color: theme === "dark" ? "#fff" : undefined,
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                )}
            </Box>
        );
    }

    // Original resource rendering for non-cluster types
    if (!resource) return <></>;

    // Create a basic summary table for any resource
    return (
        <Table sx={{ borderRadius: 1 }}>
            <TableBody>
                {[
                    { label: "KIND", value: resource.kind },
                    { label: "NAME", value: resource.name },
                    { label: "NAMESPACE", value: resource.namespace },
                    { label: "CREATED AT", value: `${resource.createdAt} (${resource.age})` },
                ].map((row, index) => (
                    <TableRow key={index}>
                        <TableCell
                            sx={{
                                borderBottom: theme === "dark" ? "1px solid #444" : "1px solid #e0e0e0",
                                color: theme === "dark" ? "#D4D4D4" : "#333333",
                                fontSize: "14px",
                                fontWeight: 500,
                                width: '150px',
                                padding: '10px 16px'
                            }}
                        >
                            {row.label}
                        </TableCell>
                        <TableCell
                            sx={{
                                borderBottom: theme === "dark" ? "1px solid #444" : "1px solid #e0e0e0",
                                color: theme === "dark" ? "#D4D4D4" : "#333333",
                                fontSize: "14px",
                                padding: '10px 16px'
                            }}
                        >
                            {row.value}
                        </TableCell>
                    </TableRow>
                ))}
                {resourceData?.metadata?.labels && Object.keys(resourceData.metadata.labels).length > 0 && (
                    <TableRow>
                        <TableCell
                            sx={{
                                borderBottom: theme === "dark" ? "1px solid #444" : "1px solid #e0e0e0",
                                color: theme === "dark" ? "#D4D4D4" : "#333333",
                                fontSize: "14px",
                                fontWeight: 500,
                                width: '150px',
                                padding: '10px 16px',
                                verticalAlign: 'top'
                            }}
                        >
                            LABELS
                        </TableCell>
                        <TableCell
                            sx={{
                                borderBottom: theme === "dark" ? "1px solid #444" : "1px solid #e0e0e0",
                                color: theme === "dark" ? "#D4D4D4" : "#333333",
                                fontSize: "14px",
                                padding: '10px 16px'
                            }}
                        >
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {resourceData.metadata.labels && Object.entries(resourceData.metadata.labels).map(([key, value], index) => (
                                    <Chip
                                        key={index}
                                        label={`${key}: ${value}`}
                                        size="small"
                                        sx={{
                                            mr: 1,
                                            mb: 1,
                                            backgroundColor: theme === "dark" ? "#334155" : undefined,
                                            color: theme === "dark" ? "#fff" : undefined,
                                        }}
                                    />
                                ))}
                            </Box>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default RenderSummary;