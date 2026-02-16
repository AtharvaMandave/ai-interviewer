/**
 * Diagram Describer
 * 
 * Parses tldraw JSON snapshot into a human-readable text description.
 * This description is appended to the user's answer for AI evaluation.
 * 
 * Extracts: shapes (boxes, text, circles), arrows/connections, labels, and layout.
 */

/**
 * Convert a tldraw snapshot JSON into a text description
 * @param {Object} drawingData - tldraw document snapshot
 * @returns {string} Human-readable description, or empty string if no meaningful content
 */
function describeDrawing(drawingData) {
    if (!drawingData) return "";

    try {
        const records = extractRecords(drawingData);
        if (records.length === 0) return "";

        const shapes = [];
        const arrows = [];
        const texts = [];
        const shapeMap = new Map(); // id -> shape info for arrow resolution

        for (const record of records) {
            if (record.typeName !== "shape") continue;

            const shapeType = record.type;
            const props = record.props || {};

            if (shapeType === "arrow") {
                arrows.push({
                    id: record.id,
                    startBinding: record.props?.start,
                    endBinding: record.props?.end,
                    label: props.text?.trim() || null,
                });
            } else if (shapeType === "text") {
                const text = props.text?.trim();
                if (text) {
                    texts.push(text);
                    shapeMap.set(record.id, { type: "text", label: text });
                }
            } else if (shapeType === "geo") {
                const geoType = props.geo || "rectangle";
                const label = props.text?.trim() || null;
                const info = { type: geoType, label };
                shapes.push(info);
                shapeMap.set(record.id, info);
            } else if (shapeType === "note") {
                const label = props.text?.trim() || null;
                if (label) {
                    shapes.push({ type: "note", label });
                    shapeMap.set(record.id, { type: "note", label });
                }
            } else if (shapeType === "frame") {
                const label = props.name?.trim() || null;
                if (label) {
                    shapes.push({ type: "frame", label });
                    shapeMap.set(record.id, { type: "frame", label });
                }
            } else if (shapeType === "draw") {
                shapes.push({ type: "freehand", label: null });
                shapeMap.set(record.id, { type: "freehand", label: null });
            } else if (shapeType === "line") {
                shapes.push({ type: "line", label: null });
                shapeMap.set(record.id, { type: "line", label: null });
            } else {
                // Generic shape
                const label = props.text?.trim() || props.name?.trim() || null;
                if (label) {
                    shapes.push({ type: shapeType, label });
                    shapeMap.set(record.id, { type: shapeType, label });
                }
            }
        }

        // Build description parts
        const parts = [];

        // Describe shapes
        if (shapes.length > 0) {
            const labeledShapes = shapes.filter(s => s.label);
            const unlabeledCounts = {};

            shapes.filter(s => !s.label).forEach(s => {
                unlabeledCounts[s.type] = (unlabeledCounts[s.type] || 0) + 1;
            });

            if (labeledShapes.length > 0) {
                const grouped = {};
                labeledShapes.forEach(s => {
                    const type = s.type === "rectangle" ? "box" : s.type;
                    if (!grouped[type]) grouped[type] = [];
                    grouped[type].push(s.label);
                });

                const descriptions = Object.entries(grouped).map(([type, labels]) => {
                    const plural = labels.length > 1 ? `${labels.length} ${type}es` : `a ${type}`;
                    return `${plural} labeled: ${labels.map(l => `"${l}"`).join(", ")}`;
                });

                parts.push(`Contains ${descriptions.join("; ")}`);
            }

            if (Object.keys(unlabeledCounts).length > 0) {
                const desc = Object.entries(unlabeledCounts)
                    .map(([type, count]) => `${count} ${type}${count > 1 ? "s" : ""}`)
                    .join(", ");
                parts.push(`Also has ${desc}`);
            }
        }

        // Describe arrows/connections
        if (arrows.length > 0) {
            const connectionDescs = [];

            for (const arrow of arrows) {
                const startId = arrow.startBinding?.boundShapeId;
                const endId = arrow.endBinding?.boundShapeId;

                const startShape = startId ? shapeMap.get(startId) : null;
                const endShape = endId ? shapeMap.get(endId) : null;

                const startLabel = startShape?.label || "?";
                const endLabel = endShape?.label || "?";

                if (startShape?.label && endShape?.label) {
                    const arrowLabel = arrow.label ? ` (${arrow.label})` : "";
                    connectionDescs.push(`${startLabel} → ${endLabel}${arrowLabel}`);
                } else if (arrow.label) {
                    connectionDescs.push(`arrow labeled "${arrow.label}"`);
                }
            }

            if (connectionDescs.length > 0) {
                parts.push(`Connections: ${connectionDescs.join(", ")}`);
            } else if (arrows.length > 0) {
                parts.push(`${arrows.length} arrow${arrows.length > 1 ? "s" : ""} connecting shapes`);
            }
        }

        // Describe standalone text
        if (texts.length > 0) {
            const nonLabelTexts = texts.filter(t =>
                !shapes.some(s => s.label === t)
            );
            if (nonLabelTexts.length > 0) {
                parts.push(`Text notes: ${nonLabelTexts.map(t => `"${t}"`).join(", ")}`);
            }
        }

        if (parts.length === 0) return "";

        return `\n\n[Whiteboard Diagram]\n${parts.join(". ")}.`;

    } catch (error) {
        console.error("[DiagramDescriber] Failed to parse drawing:", error.message);
        return "";
    }
}

/**
 * Extract shape records from various tldraw snapshot formats
 */
function extractRecords(drawingData) {
    // tldraw v2 store format: { store: { "shape:xxx": {...}, ... } }
    if (drawingData.store && typeof drawingData.store === "object") {
        return Object.values(drawingData.store).filter(r => r.typeName === "shape");
    }

    // tldraw getSnapshot() format: { document: { store: {...} } }
    if (drawingData.document?.store && typeof drawingData.document.store === "object") {
        return Object.values(drawingData.document.store).filter(r => r.typeName === "shape");
    }

    // Direct array of records
    if (Array.isArray(drawingData)) {
        return drawingData.filter(r => r.typeName === "shape");
    }

    // Flat object of records
    if (typeof drawingData === "object") {
        const values = Object.values(drawingData);
        if (values.length > 0 && values[0]?.typeName) {
            return values.filter(r => r.typeName === "shape");
        }
    }

    return [];
}

module.exports = { describeDrawing };
