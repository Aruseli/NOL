"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
var zod_1 = require("zod");
var node_fetch_1 = require("node-fetch");
var fs = require("fs/promises");
var path = require("path");
// Create MCP server instance
var server = new mcp_js_1.McpServer({ name: "NOL MCP Server", version: "1.0.0" });
// --- Tool: External Database API (Demo) ---
// Example: fetch user data from a fake REST API
server.tool("fetchUserFromDemoDb", { userId: zod_1.z.string() }, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var response, user;
    var userId = _b.userId;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, (0, node_fetch_1.default)("https://jsonplaceholder.typicode.com/users/".concat(userId))];
            case 1:
                response = _c.sent();
                if (!response.ok) {
                    return [2 /*return*/, {
                            content: [], // Добавляем пустой массив content
                            error: "User with id ".concat(userId, " not found"),
                            isError: true // Указываем, что это ошибка
                        }];
                }
                return [4 /*yield*/, response.json()];
            case 2:
                user = _c.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(user),
                            },
                        ],
                    }];
        }
    });
}); });
// --- Tool: CRM Integration (amoCRM example) ---
// This is a simplified example that fetches a contact by ID from amoCRM demo API
// In real usage, authentication and proper API calls are needed
server.tool("fetchAmoCrmContact", { contactId: zod_1.z.string() }, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var amoCrmDemoUrl, response, contact, e_1;
    var contactId = _b.contactId;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                amoCrmDemoUrl = "https://demo.amocrm.com/api/v4/contacts/".concat(contactId);
                _c.label = 1;
            case 1:
                _c.trys.push([1, 4, , 5]);
                return [4 /*yield*/, (0, node_fetch_1.default)(amoCrmDemoUrl, {
                        headers: {
                            Authorization: "Bearer DEMO_ACCESS_TOKEN", // Replace with real token
                            Accept: "application/json",
                        },
                    })];
            case 2:
                response = _c.sent();
                if (!response.ok) {
                    return [2 /*return*/, {
                            content: [], // Добавляем пустой массив content
                            error: "Contact with id ".concat(contactId, " not found"),
                            isError: true // Указываем, что это ошибка
                        }];
                }
                return [4 /*yield*/, response.json()];
            case 3:
                contact = _c.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: contactId,
                            },
                        ],
                    }];
            case 4:
                e_1 = _c.sent();
                return [2 /*return*/, {
                        content: [], // Добавляем пустой массив content
                        error: "Failed to fetch amoCRM contact: ".concat(e_1.message),
                        isError: true // Указываем, что это ошибка
                    }];
            case 5: return [2 /*return*/];
        }
    });
}); });
// --- Tool: Local File Reader ---
// Reads a file from a given path and returns its contents as text
server.tool("readLocalFile", { filePath: zod_1.z.string() }, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var baseDir, resolvedPath, content, e_2;
    var filePath = _b.filePath;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                baseDir = path.resolve("./data");
                resolvedPath = path.resolve(filePath);
                if (!resolvedPath.startsWith(baseDir)) {
                    return [2 /*return*/, {
                            content: [], // Добавляем пустой массив content
                            error: "Access denied: file path outside allowed directory",
                            isError: true // Указываем, что это ошибка
                        }];
                }
                return [4 /*yield*/, fs.readFile(resolvedPath, "utf-8")];
            case 1:
                content = _c.sent();
                return [2 /*return*/, {
                        content: [
                            {
                                type: "text",
                                text: content,
                            },
                        ],
                    }];
            case 2:
                e_2 = _c.sent();
                return [2 /*return*/, {
                        content: [], // Добавляем пустой массив content
                        error: "Failed to read file: ".concat(e_2.message),
                        isError: true // Указываем, что это ошибка
                    }];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- Resource: Generic Data Reader ---
// Example resource that returns some static or dynamic data
server.resource("exampleData://info", new mcp_js_1.ResourceTemplate("exampleData://info", { list: undefined }), function (uri) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, {
                contents: [
                    {
                        uri: uri.href,
                        text: "This is example data from the MCP server resource.",
                    },
                ],
            }];
    });
}); });
// Start MCP server using stdio transport (for demo/testing)
function start() {
    return __awaiter(this, void 0, void 0, function () {
        var transport;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    transport = new stdio_js_1.StdioServerTransport();
                    return [4 /*yield*/, server.connect(transport)];
                case 1:
                    _a.sent();
                    console.log("MCP server running...");
                    return [2 /*return*/];
            }
        });
    });
}
start().catch(console.error);
