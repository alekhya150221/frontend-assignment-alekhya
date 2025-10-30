import React, { useState, useRef } from "react";
import Swal from "sweetalert2";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "react-bootstrap";

const JsonTreeVisualizer = () => {
  const [jsonInput, setJsonInput] = useState("");
  const [theme, setTheme] = useState("light");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);
  const [rfInstance, setRfInstance] = useState(null);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };



  const buildTree = (
    data,
    parentId = null,
    depth = 0,
    keyName = "root",
    x = 0,
    y = 0
  ) => {
    const id = `${parentId ? parentId + "-" : ""}${keyName}`;


    const isArray = Array.isArray(data);
    const isObject = typeof data === "object" && data !== null && !isArray;
    const isPrimitive = !isObject && !isArray;


    let color = "#3b82f6";
    if (isArray) color = "#22c55e";
    if (isPrimitive) color = "#f59e0b";


    const node = {
      id,
      data: { label: keyName },
      position: { x, y },
      style: {
        background: color,
        color: "white",
        padding: 10,
        borderRadius: 12,
        fontSize: 14,
        textAlign: "center",
        width: 120,
        boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
        border: "2px solid rgba(255,255,255,0.4)",
      },
    };

    const nodesArr = [node];
    const edgesArr = [];


    if (isPrimitive) {
      const valueId = `${id}-value`;
      const valueNode = {
        id: valueId,
        data: { label: JSON.stringify(data) },
        position: { x, y: y + 100 },
        style: {
          background: "#f59e0b",
          color: "white",
          padding: 8,
          borderRadius: 8,
          width: 100,
          textAlign: "center",
          fontSize: 13,
          boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
          border: "2px solid rgba(255,255,255,0.4)",
        },
      };
      nodesArr.push(valueNode);
      edgesArr.push({
        id: `${id}-value-edge`,
        source: id,
        target: valueId,
        animated: true,
        style: { stroke: "#fbbf24", strokeWidth: 2 },
      });
      return { nodes: nodesArr, edges: edgesArr };
    }


    const entries = isArray ? data.map((v, i) => [i, v]) : Object.entries(data);
    const spacingX = 180;
    const spacingY = 140;
    const totalWidth = entries.length * spacingX;
    let startX = x - totalWidth / 2 + spacingX / 2;

    for (const [k, v] of entries) {
      const childX = startX;
      const childY = y + spacingY;
      const childTree = buildTree(v, id, depth + 1, k, childX, childY);
      nodesArr.push(...childTree.nodes);
      edgesArr.push({
        id: `${id}-${k}-edge`,
        source: id,
        target: childTree.nodes[0].id,
        type: "smoothstep",
        style: { stroke: "#94a3b8", strokeWidth: 2 },
      });
      edgesArr.push(...childTree.edges);
      startX += spacingX;
    }

    return { nodes: nodesArr, edges: edgesArr };
  };


  // const onClickGenerateTree = () => {
  //   if (!jsonInput.trim()) {
  //     Swal.fire({
  //       icon: "warning",
  //       title: "No JSON entered!",
  //       text: "Please enter valid JSON data before generating the tree.",
  //     });
  //     return;
  //   }

  //   try {
  //     const parsed = JSON.parse(jsonInput);
  //     const rootKey = Object.keys(parsed)[0];
  //     const { nodes, edges } = buildTree(parsed[rootKey], null, 0, rootKey);
  //     setNodes(nodes);
  //     setEdges(edges);
  //     Swal.fire({
  //       icon: "success",
  //       title: "Tree generated successfully!",
  //       timer: 1500,
  //       showConfirmButton: false,
  //     });
  //   } catch (err) {
  //     Swal.fire({
  //       icon: "error",
  //       title: "Invalid JSON!",
  //       text: "Please check your JSON syntax and try again.",
  //     });
  //   }
  // };


  const onClickGenerateTree = () => {
  if (!jsonInput.trim()) {
    Swal.fire({
      icon: "warning",
      title: "No JSON entered!",
      text: "Please enter valid JSON data before generating the tree.",
    });
    return;
  }

  try {
    const parsed = JSON.parse(jsonInput);

    // Build full tree (not just first key)
    const { nodes, edges } = buildTree(parsed, null, 0, "root", 0, 0);

    setNodes(nodes);
    setEdges(edges);
    Swal.fire({
      icon: "success",
      title: "Tree generated successfully!",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Invalid JSON!",
      text: "Please check your JSON syntax and try again.",
    });
  }
};

  const onClickResetTree = () => {
    if (!jsonInput.trim() && nodes.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Nothing to reset!",
      });
      return;
    }

    setJsonInput("");
    setNodes([]);
    setEdges([]);
    Swal.fire({
      icon: "success",
      title: "Tree reset successfully!",
    });
  };


  const handleSearch = () => {
    let path = document.getElementById("search-input").value.trim();

    if (!path) {
      Swal.fire({
        icon: "info",
        title: "Enter a JSON path!",
        text: "Example: $.user.address.city or items[0].name",
      });
      return;
    }


    path = path
      .replace(/^\$\.?/, "")
      .replace(/\[/g, "-")
      .replace(/\]/g, "")
      .replace(/\./g, "-");


    const found =
      nodes.find((n) => n.id.endsWith(path)) ||
      nodes.find((n) => n.id.includes(path));

    if (found) {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === found.id
            ? {
              ...n,
              style: {
                ...n.style,
                border: "4px solid #ef4444",
                boxShadow: "0 0 12px red",
              },
            }
            : {
              ...n,
              style: {
                ...n.style,
                border: "2px solid rgba(255,255,255,0.4)",
                boxShadow: "none",
              },
            }
        )
      );

      if (rfInstance)
        rfInstance.setCenter(found.position.x, found.position.y, {
          zoom: 1.5,
          duration: 800,
        });

      Swal.fire({
        icon: "success",
        title: "Match found!",
        text: `Found node: ${found.data.label}`,
        timer: 1500,
        showConfirmButton: false,
      });
    } else {
      Swal.fire({
        icon: "warning",
        title: "No match found!",
        text: "No node matches the given path.",
      });
    }
  };


  return (
    <div className={`app-container ${theme}`}>
      <div className="header">
        <h2>JSON Tree Visualizer</h2>
        <div className="toggle-wrapper">
          <span>Dark/Light</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={toggleTheme}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="main-content">
        <div className="left-panel">
          <label>Paste or type JSON data</label>
          <textarea
            placeholder='{"user": {"id": 1, "name": "Alekhya", "address": {"city": "New York", "country": "USA"}, "items": [{"name": "item1"}, {"name": "item2"}]}}'
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          ></textarea>

          <div className="button-group">
            <Button className="generate-btn" onClick={onClickGenerateTree}>
              Generate Tree
            </Button>
            <Button className="reset-btn" onClick={onClickResetTree}>
              Reset Tree
            </Button>
          </div>
        </div>

        <div className="right-panel">
          <div className="search-bar">
            <input id="search-input" type="text" placeholder="$.user.address.city" />
            <button className="search-btn" onClick={handleSearch}>
              Search
            </button>
          </div>

          <div className="tree-container" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              fitView
              onInit={setRfInstance}
            >
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonTreeVisualizer;
