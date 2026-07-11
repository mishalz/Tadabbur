import React, { useEffect, useRef, useState, useContext } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
} from "d3-force";
import { UserContext } from "@/context/UserContext";
import { Spinner } from "./ui/spinner";

function ConnectionGraph({ connections, setDataToFetch }) {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [simulationNodes, setSimulationNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [deleteNotification, setDeleteNotification] = useState(null);
  const { tokens } = useContext(UserContext);

  const deleteConnectionHandler = async (fromVerseKey, toVerseKey) => {
    try {
      setIsDeleteLoading(true);
      setDeleteNotification(null);

      const response = await fetch(
        `${process.env.VITE_API_URL}/api/content/connections/${fromVerseKey}/${toVerseKey}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete connection");
      }

      // Remove the connection from the state
      setLinks((prevLinks) =>
        prevLinks.filter(
          (link) =>
            !(link.sourceId === fromVerseKey && link.targetId === toVerseKey),
        ),
      );
      //also remove the to node
      setNodes((prevNodes) =>
        prevNodes.filter((node) => node.id !== toVerseKey),
      );

      // Trigger refetch of connections
      setDeleteNotification({
        type: "success",
        message: "Connection deleted successfully",
      });
      setDataToFetch(true);
    } catch (error) {
      console.error("Error deleting connection:", error);
      setDeleteNotification({
        type: "error",
        message: "Failed to delete connection",
      });
    } finally {
      setIsDeleteLoading(false);
    }
  };

  // Initialize graph data from connections
  useEffect(() => {
    if (!connections || connections.length === 0) return;

    // Create nodes from verses in connections
    const nodeMap = new Map();
    const newNodes = [];
    const newLinks = [];

    connections.forEach((connection) => {
      const fromKey = connection.fromVerse.key;
      const toKey = connection.toVerse.key;

      // Add fromVerse node if not exists
      if (!nodeMap.has(fromKey)) {
        const node = {
          id: fromKey,
          arabicText: connection.fromVerse.text_arabicText,
          translation: connection.fromVerse.translation,
          x: Math.random() * 200 - 100, // Random initial position
          y: Math.random() * 200 - 100,
        };
        nodeMap.set(fromKey, node);
        newNodes.push(node);
      }

      // Add toVerse node if not exists
      if (!nodeMap.has(toKey)) {
        const node = {
          id: toKey,
          arabicText: connection.toVerse.text_arabicText,
          translation: connection.toVerse.translation,
          x: Math.random() * 200 - 100, // Random initial position
          y: Math.random() * 200 - 100,
        };
        nodeMap.set(toKey, node);
        newNodes.push(node);
      }

      // Add link between verses
      newLinks.push({
        source: fromKey,
        target: toKey,
        sourceId: fromKey, // Store original IDs before d3-force mutates them
        targetId: toKey,
        note: connection.note,
      });
    });

    setNodes(newNodes);
    setLinks(newLinks);
  }, [connections]);

  // Initialize d3 force simulation
  useEffect(() => {
    if (nodes.length === 0 || !svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Create a copy of nodes for simulation to avoid modifying state during forces
    const simulationNodesCopy = nodes.map((node) => ({ ...node }));

    // Create simulation
    const simulation = forceSimulation(simulationNodesCopy)
      .force(
        "link",
        forceLink(links)
          .id((d) => d.id)
          .distance(150),
      )
      .force("charge", forceManyBody().strength(-400))
      .force("center", forceCenter(width / 2, height / 2))
      .on("tick", () => {
        // Update state with new positions on each tick
        setSimulationNodes([...simulationNodesCopy]);
      });

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [nodes, links]);

  // Helper function to truncate Arabic text
  const truncateArabic = (text, length = 20) => {
    if (!text) return "";
    return text.length > length ? text.substring(0, length) + "..." : text;
  };

  // Helper function to get all connected node IDs for a given node
  const getConnectedNodeIds = (nodeId) => {
    const connectedIds = new Set();
    links.forEach((link) => {
      if (link.sourceId === nodeId) {
        connectedIds.add(link.targetId);
      } else if (link.targetId === nodeId) {
        connectedIds.add(link.sourceId);
      }
    });
    return connectedIds;
  };

  // Zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * delta));
    setZoom(newZoom);
  };

  // Pan handlers
  const handleMouseDown = (e) => {
    if (e.button === 2 || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Reset zoom and pan
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Attach event listeners
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    svg.addEventListener("wheel", handleWheel, { passive: false });
    svg.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    svg.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      svg.removeEventListener("wheel", handleWheel);
      svg.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      svg.removeEventListener("contextmenu", (e) => e.preventDefault());
    };
  }, [isPanning, pan, panStart]);

  //remove delete error after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setDeleteNotification(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [deleteNotification]);

  return (
    <>
      <div className="relative">
        <svg
          ref={svgRef}
          className="w-full h-96 border border-foreground-border/20 rounded-lg bg-foreground-bg/50"
          style={{ cursor: isPanning ? "grabbing" : "grab" }}
        >
          {/* Group for pan and zoom transforms */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Draw links (edges) */}
            <g className="links">
              {links.map((link, idx) => {
                const sourceNode = simulationNodes.find(
                  (n) => n.id === link.sourceId,
                );
                const targetNode = simulationNodes.find(
                  (n) => n.id === link.targetId,
                );

                if (!sourceNode || !targetNode) return null;

                return (
                  <g key={`link-${idx}`}>
                    {/* Edge line */}
                    <line
                      x1={sourceNode.x || 0}
                      y1={sourceNode.y || 0}
                      x2={targetNode.x || 0}
                      y2={targetNode.y || 0}
                      stroke="#4bc4c4"
                      strokeWidth="2.5"
                      opacity="0.7"
                      className="transition-all"
                    />

                    {/* Note label on edge (if note exists) */}
                    {link.note && (
                      <g
                        onClick={() => {
                          // Select the connection view with both nodes and note
                          setSelectedNode({
                            type: "connection",
                            sourceNode: sourceNode,
                            targetNode: targetNode,
                            connectionNote: link.note,
                          });
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {/* Calculate midpoint */}
                        {(() => {
                          const midX =
                            ((sourceNode.x || 0) + (targetNode.x || 0)) / 2;
                          const midY =
                            ((sourceNode.y || 0) + (targetNode.y || 0)) / 2;

                          return (
                            <g transform={`translate(${midX}, ${midY})`}>
                              {/* Rectangle background for "notes" banner */}
                              <rect
                                x="-25"
                                y="-12"
                                width="50"
                                height="24"
                                fill="#374151"
                                stroke="#4bc4c4"
                                strokeWidth="1"
                                rx="4"
                                className="hover:fill-primary-600 hover:stroke-primary-400 transition-colors"
                              />
                              {/* "notes" text */}
                              <text
                                textAnchor="middle"
                                dy="4"
                                fontSize="10"
                                fontWeight="500"
                                fill="#e5e7eb"
                                className="pointer-events-none"
                              >
                                Note
                              </text>
                            </g>
                          );
                        })()}
                      </g>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Draw nodes (verses) */}
            <g className="nodes">
              {simulationNodes.map((node) => {
                const isSelected =
                  selectedNode?.id === node.id ||
                  (selectedNode?.type === "connection" &&
                    (selectedNode.sourceNode.id === node.id ||
                      selectedNode.targetNode.id === node.id));
                const connectedIds = selectedNode
                  ? getConnectedNodeIds(selectedNode.id)
                  : new Set();
                const isConnected = selectedNode && connectedIds.has(node.id);

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x || 0},${node.y || 0})`}
                    onClick={() => setSelectedNode(node)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Oval background */}
                    <ellipse
                      rx="50"
                      ry="35"
                      fill={
                        isSelected
                          ? "#1c4d4d"
                          : isConnected
                            ? "#123030"
                            : "#1f2937"
                      }
                      stroke={
                        isSelected
                          ? "#338f8f"
                          : isConnected
                            ? "#266666"
                            : "#4b5563"
                      }
                      strokeWidth="1"
                      className="hover:stroke-primary-400 transition-colors"
                    />

                    {/* Verse key text */}
                    <text
                      textAnchor="middle"
                      dy="-8"
                      fontSize="12"
                      fontWeight="bold"
                      fill="#e5e7eb"
                      className="pointer-events-none"
                    >
                      {node.id}
                    </text>

                    {/* Arabic text snippet */}
                    <text
                      textAnchor="middle"
                      dy="12"
                      fontSize="11"
                      fill="#a1a5ae"
                      className="pointer-events-none"
                    >
                      {truncateArabic(node.arabicText, 12)}
                    </text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {/* Zoom and Pan Controls */}
        <div className="absolute top-3 right-3 flex gap-2 bg-foreground-bg/80 p-2 rounded border border-foreground-border/20">
          <button
            onClick={() => setZoom(Math.min(3, zoom * 1.2))}
            title="Zoom In (Scroll)"
            className="px-2 py-1 text-xs font-semibold bg-primary-500/20 border border-primary-500/50 rounded hover:bg-primary-500/30 text-primary-300 transition-colors"
          >
            +
          </button>
          <div className="text-xs text-foreground-muted flex items-center px-2">
            {(zoom * 100).toFixed(0)}%
          </div>
          <button
            onClick={() => setZoom(Math.max(0.5, zoom * 0.8))}
            title="Zoom Out (Scroll)"
            className="px-2 py-1 text-xs font-semibold bg-primary-500/20 border border-primary-500/50 rounded hover:bg-primary-500/30 text-primary-300 transition-colors"
          >
            -
          </button>
          <div className="w-px bg-foreground-border/20"></div>
          <button
            onClick={handleReset}
            title="Reset Pan & Zoom"
            className="px-2 py-1 text-xs font-semibold bg-primary-500/20 border border-primary-500/50 rounded hover:bg-primary-500/30 text-primary-300 transition-colors"
          >
            ↺
          </button>
        </div>

        {/* Pan/Zoom Instructions */}
        <div className="absolute bottom-3 left-3 text-xs text-foreground-muted bg-foreground-bg/80 px-2 py-1 rounded border border-foreground-border/20">
          Scroll to zoom • Alt + Drag to pan
        </div>
      </div>

      {/* Display selected node details */}
      {selectedNode && selectedNode.type === "connection" ? (
        // Connection view (two verses side-by-side on large screens)
        <div className="mt-4 p-4 bg-foreground-bg border border-primary/20 rounded-lg">
          <div className="flex justify-between items-start gap-3 mb-3">
            <h3 className="text-lg font-semibold text-white">
              Connection: {selectedNode.sourceNode.id} ↔{" "}
              {selectedNode.targetNode.id}
            </h3>

            <button
              onClick={() => setSelectedNode(null)}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Two-column layout on large screens, single column on small screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Source Verse */}
            <div className="space-y-3 p-3 bg-foreground-bg/50 border border-foreground-border/20 rounded">
              <h4 className="text-sm font-semibold text-primary-foreground">
                From: {selectedNode.sourceNode.id}
              </h4>

              <div>
                <p className="text-xs font-semibold text-foreground-muted mb-1">
                  Arabic:
                </p>
                <p className="text-sm text-right text-foreground leading-relaxed">
                  {selectedNode.sourceNode.arabicText}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground-muted mb-1">
                  Translation:
                </p>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  {selectedNode.sourceNode.translation}
                </p>
              </div>
            </div>
            {/* Target Verse */}
            <div className="space-y-3 p-3 bg-foreground-bg/50 border border-foreground-border/20 rounded">
              <h4 className="text-sm font-semibold text-primary-300">
                To: {selectedNode.targetNode.id}
              </h4>

              <div>
                <p className="text-xs font-semibold text-foreground-muted mb-1">
                  Arabic:
                </p>
                <p className="text-sm text-right text-foreground leading-relaxed">
                  {selectedNode.targetNode.arabicText}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground-muted mb-1">
                  Translation:
                </p>
                <p className="text-sm text-foreground-muted leading-relaxed">
                  {selectedNode.targetNode.translation}
                </p>
              </div>
            </div>
          </div>

          {/* Connection Note at bottom */}
          {selectedNode.connectionNote && (
            <div>
              <h4 className="text-xs font-semibold text-foreground-muted mb-1">
                Connection Note:
              </h4>
              <p className="text-sm text-primary/90 leading-relaxed bg-primary/10 p-2 rounded border border-primary/20">
                {selectedNode.connectionNote}
              </p>
            </div>
          )}

          {/* To delete the connection */}
          <button
            className="mt-5 cursor-pointer bg-red-500/50 border border-red-500/10 flex items-center gap-4 text-white px-3 py-2 rounded-full hover:bg-red-600/60 transition-colors duration-300 ease-in-out w-fit text-sm"
            onClick={() =>
              deleteConnectionHandler(
                selectedNode.sourceNode.id,
                selectedNode.targetNode.id,
              )
            }
          >
            {isDeleteLoading ? (
              <Spinner className="w-4 h-4" />
            ) : (
              <>
                <span>Delete Connection</span>
              </>
            )}
          </button>
          {deleteNotification && (
            <p
              className={`text-sm mt-2 ${deleteNotification.type === "error" ? "text-red-400" : "text-green-400"}`}
            >
              {deleteNotification.message}
            </p>
          )}
        </div>
      ) : selectedNode ? (
        // Single node view (existing behavior)
        <div className="mt-4 p-4 bg-foreground-bg border border-primary/20  rounded-lg">
          <div className="flex justify-between items-start gap-3 mb-3">
            <h3 className="text-lg font-semibold text-primary-400">
              Verse: {selectedNode.id}
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-sm text-foreground-muted hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Arabic text */}
            <div>
              <h4 className="text-xs font-semibold text-foreground-muted mb-1">
                Arabic:
              </h4>
              <p className="text-sm text-right text-foreground leading-relaxed">
                {selectedNode.arabicText}
              </p>
            </div>

            {/* Translation */}
            <div>
              <h4 className="text-xs font-semibold text-foreground-muted mb-1">
                Translation:
              </h4>
              <p className="text-sm text-foreground-muted leading-relaxed">
                {selectedNode.translation}
              </p>
            </div>

            {/* Connection Note (if exists) */}
            {selectedNode.connectionNote && (
              <div>
                <h4 className="text-xs font-semibold text-foreground-muted mb-1">
                  Connection Note:
                </h4>
                <p className="text-sm text-primary-300 leading-relaxed bg-primary-500/10 p-2 rounded border border-primary-500/20">
                  {selectedNode.connectionNote}
                </p>
              </div>
            )}

            {/* Connected verses */}
            {(() => {
              const connectedIds = getConnectedNodeIds(selectedNode.id);
              if (connectedIds.size > 0) {
                return (
                  <div>
                    <h4 className="text-xs font-semibold text-foreground-muted mb-2">
                      Connected to:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(connectedIds).map((id) => (
                        <button
                          key={id}
                          onClick={() => {
                            const connectedNode = nodes.find(
                              (n) => n.id === id,
                            );
                            if (connectedNode) setSelectedNode(connectedNode);
                          }}
                          className="px-2 py-1 text-xs bg-primary/20 border border-primary/50 rounded hover:bg-primary/30 text-primary/90 transition-colors"
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default ConnectionGraph;
