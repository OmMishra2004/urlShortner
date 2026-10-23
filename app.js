import fs from "fs/promises"
import http from "http"
import path from "path"
import crypto from "crypto"

const dataFilePath = path.join(import.meta.dirname, "data", "links.json")

const serveFile = async (res, filePath, contentType) => {
    try {
        const data = await fs.readFile(filePath)
        res.writeHead(200, { "Content-Type": contentType })
        res.end(data)
    } catch (error) {
        res.writeHead(404, { "Content-Type": "text/plain" })
        res.end("404 page not found")
    }
}

const loadLinks = async () => {
    try {
        const rawData = await fs.readFile(dataFilePath, "utf-8")
        return JSON.parse(rawData)
    } catch (error) {
        if (error.code === "ENOENT") {
            await fs.writeFile(dataFilePath, JSON.stringify({}), "utf-8")
            return {}
        }
        throw error
    }
}

const saveLinks = async (links) => {
    await fs.writeFile(dataFilePath, JSON.stringify(links), "utf-8")
}

const server = http.createServer(async (req, res) => {
    if (req.method === "GET") {
        if (req.url === "/") {
            return serveFile(res, path.join(import.meta.dirname, "public", "index.html"), "text/html")
        } else if (req.url === "/style.css") {
            return serveFile(res, path.join(import.meta.dirname, "public", "style.css"), "text/css")
        } else if (req.url === "/script.js") {
            return serveFile(res, path.join(import.meta.dirname, "public", "script.js"), "text/javascript")
        } else if (req.url === "/links") {
            try {
                const links = await loadLinks()
                res.writeHead(200, { "Content-Type": "application/json" })
                return res.end(JSON.stringify(links))
            } catch (error) {
                console.error(error)
                res.writeHead(500, { "content-type": "text/plain" });
                return res.end("Internal Server Error: Could not load links.");
            }
        } else {
            try {
                const links = await loadLinks()
                const shortCode = req.url.slice(1)
                if (links[shortCode]) {
                    res.writeHead(302, { location: links[shortCode] })
                    return res.end()
                } else {
                    res.writeHead(404, { "content-type": "text/plain" })
                    return res.end("Page not found.")
                }
            } catch (error) {
                console.error(error)
                res.writeHead(500, { "content-type": "text/plain" });
                return res.end("Internal Server Error: Could not load links.");
            }
        }
    }

    if (req.method === "POST") {
        if (req.url === "/shorten") {
            try {
                // 1. Handle errors from reading the file
                const links = await loadLinks();
                let body = "";

                req.on("data", (chunk) => {
                    body += chunk;
                });

                req.on("end", async () => {
                    try {
                        // 2. Handle errors from JSON parsing and writing to the file
                        console.log(body, typeof (body));
                        const { url, shortCode } = JSON.parse(body);

                        if (!url) {
                            res.writeHead(400, { "content-type": "text/plain" });
                            res.end("URL is required");
                            return;
                        }

                        const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");

                        if (links[finalShortCode]) {
                            res.writeHead(400, { "content-type": "text/plain" });
                            res.end("Short Code already exists, try another.");
                            return;
                        }

                        links[finalShortCode] = url;
                        await saveLinks(links); // If this fails, the inner catch handles it

                        res.writeHead(200, { "content-type": "application/json" });
                        res.end(JSON.stringify({ success: true, shortCode: finalShortCode }));

                    } catch (innerError) {
                        // Catches JSON.parse errors or saveLinks errors
                        console.error("Error processing payload or saving:", innerError);
                        res.writeHead(500, { "content-type": "text/plain" });
                        res.end("Internal Server Error: Failed to process request.");
                    }
                });

            } catch (error) {
                // Catches loadLinks errors (the one we originally discussed)
                console.error("Error loading links:", error);
                res.writeHead(500, { "content-type": "text/plain" });
                res.end("Internal Server Error: Could not load links.");
            }
        }
    }
})

const PORT = 5173
server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`))