const express = require("express");
const dotenv = require("dotenv");
const { McpServer } = require("@modelcontextprotocol/server");
const {
    NodeStreamableHTTPServerTransport
} = require("@modelcontextprotocol/node");
const { z } = require("zod");

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.MCP_PORT || 4000;

const mcpServer = new McpServer({
    name: "StudyMate AI MCP Server",
    version: "1.0.0"
});

mcpServer.registerTool(
    "ask_studymate",
    {
        title: "Ask StudyMate",
        description: "Ask StudyMate AI a study-related question.",
        inputSchema: {
            question: z.string().min(1)
        }
    },
    async ({ question }) => {
        try {
            const response = await fetch("http://localhost:3000/ask", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: question.trim()
                })
            });

            if (!response.ok) {
                throw new Error(
                    `StudyMate server returned ${response.status}`
                );
            }

            const data = await response.json();

            return {
                content: [
                    {
                        type: "text",
                        text: data.answer || "StudyMate AI ne answer nahi diya."
                    }
                ]
            };
        } catch (error) {
            console.error("ask_studymate error:", error);

            return {
                content: [
                    {
                        type: "text",
                        text: "StudyMate AI response nahi aa raha."
                    }
                ],
                isError: true
            };
        }
    }
);

app.get("/", (req, res) => {
    res.json({
        name: "StudyMate AI MCP Server",
        status: "running",
        mcp: "/mcp"
    });
});

app.all("/mcp", async (req, res) => {
    try {
        const transport = new NodeStreamableHTTPServerTransport({
            sessionIdGenerator: undefined
        });

        await mcpServer.connect(transport);

        await transport.handleRequest(req, res, req.body);
    } catch (error) {
        console.error("MCP HTTP error:", error);

        if (!res.headersSent) {
            res.status(500).json({
                error: "MCP server error"
            });
        }
    }
});

app.listen(PORT, () => {
    console.log(
        `StudyMate MCP Server running at http://localhost:${PORT}`
    );

    console.log(
        `MCP Streamable HTTP endpoint: http://localhost:${PORT}/mcp`
    );
});
