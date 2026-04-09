import json
import logging
import aiohttp
import os
from livekit.agents import llm
from duckduckgo_search import DDGS
from bs4 import BeautifulSoup

logger = logging.getLogger("n8n-tools")

@llm.function_tool(description="Acts as a compiler to create an n8n workflow from human intent. Called when the user wants to finalize and deploy an n8n automation workflow.")
async def create_workflow(
    name: str = "AI Generated Workflow",
    nodes: str = "[]",
    connections: str = "{}"
) -> str:
    """
    Takes the compiled nodes and connections, formats them into the strict JSON
    required by the n8n Public API, and posts the request.

    Args:
        name: A clear, descriptive name for the new n8n workflow.
        nodes: An array of n8n node objects. Each node must have 'name', 'type', 'typeVersion', 'position', and 'parameters'.
        connections: A dictionary of n8n connections between nodes (e.g. {'Node1': {'main': [[{'node': 'Node2', 'type': 'main', 'index': 0}]]}}).
    """
    n8n_url = os.getenv("N8N_HOST_URL", "http://localhost:5678").rstrip("/")
    api_key = os.getenv("N8N_API_KEY", "")

    logger.info(f"Received request to create n8n workflow: {name}")

    # Defensive parsing for weak local LLMs that output stringified JSON instead of native lists/dicts
    try:
        parsed_nodes = json.loads(nodes) if isinstance(nodes, str) else nodes
        parsed_connections = json.loads(connections) if isinstance(connections, str) else connections
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse nodes or connections JSON: {e}")
        return f"Failed: Invalid JSON provided for nodes or connections. Error: {e}"

    payload = {
        "name": name,
        "nodes": parsed_nodes,
        "connections": parsed_connections,
        "settings": {}
    }

    headers = {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": api_key
    }

    endpoint = f"{n8n_url}/api/v1/workflows"

    logger.info(f"POSTing payload to {endpoint}")

    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(endpoint, json=payload, headers=headers) as response:
                status = response.status
                text = await response.text()
                
                if 200 <= status < 300:
                    logger.info("Successfully created n8n workflow")
                    return f"Success! The workflow '{name}' was created successfully in n8n."
                else:
                    logger.error(f"Failed to create workflow, status: {status}, response: {text}")
                    return f"Failed to create workflow on n8n. API returned status {status}: {text}"
        except Exception as req_error:
            logger.error(f"Network error while connecting to n8n API: {req_error}")
            return f"Failed: Could not connect to n8n host. Please ensure {n8n_url} is reachable."


@llm.function_tool(description="CRITICAL REQUIRED STEP BEFORE DRAFTING: Researches and reads the official n8n documentation for a given node to learn its JSON structure and required parameters.")
async def research_n8n_node(node_name: str) -> str:
    """
    Automatically finds and reads the official n8n documentation site for a given node to extract its correct parameters.
    
    Args:
        node_name: The name of the node (e.g. 'Telegram', 'Google Sheets', 'Postgres').
    """
    logger.info(f"Researching n8n node: {node_name}")
    try:
        search_query = f"site:docs.n8n.io {node_name} node"
        target_url = None
        
        # 1. Search for the node's docs
        with DDGS() as ddgs:
            results = ddgs.text(search_query, max_results=3)
            for r in results:
                if "docs.n8n.io" in r.get('href', ''):
                    target_url = r.get('href')
                    break
                    
        if not target_url:
            return f"Could not find official n8n documentation for the '{node_name}' node."
            
        logger.info(f"Scraping docs at: {target_url}")
        
        # 2. Fetch the page content
        async with aiohttp.ClientSession() as session:
            async with session.get(target_url, timeout=10) as response:
                if response.status != 200:
                    return f"Failed to fetch document page {target_url}"
                html = await response.text()
                soup = BeautifulSoup(html, "html.parser")
                
                # Extract main content using Docusaurus 'article' tag
                article = soup.find('article')
                if article:
                    content = article.get_text(separator="\n", strip=True)
                else:
                    content = soup.get_text(separator="\n", strip=True)
                
                # Limit length to prevent local LLM context overflow
                return f"Source: {target_url}\n\nDocumentation Content:\n{content[:5000]}"
                
    except Exception as e:
        logger.error(f"Node research failed: {e}")
        return f"Failed to research node: {e}"
