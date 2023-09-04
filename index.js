import { BE_URL } from "./globals";

let initialized = false;

function nodeToDict (node) {
    //const rect = node.getBoundingClientRect();
    //console.log(rect);
    return {
        tagName: node.tagName
    };
};


export function startOrdre(options) {

    if (initialized) {
        return;
    }
    initialized = true;

    if (!("clientKey" in options) || !("ordreDeviceId" in options)) {
        console.log("startOrdre: Missing 'clientKey' or 'ordreDeviceId' parameters.");
        return;
    }

    let domIdNodesDict = {};

    const clientKey = options["clientKey"];
    const deviceId = options["ordreDeviceId"];
    const socket = new WebSocket("ws://192.168.1.53:8000/middleware/middleware_consumer/");

    socket.onmessage = function(event) {
        try {
            console.log("ordre -> socket.onmessage entered");
            const data = event.data;
            const json = JSON.parse(data);
            const type = json["type"];
            if (type == "click_node") {
                const nodeId = json["nodeId"];
                console.log("ordre -> nodeId: " + nodeId);
                if (nodeId in domIdNodesDict) {
                    domIdNodesDict[nodeId].click();
                } else {
                    console.log("ordre -> Trying to click unexisting node (id=" + nodeId + ").");
                }
            }
        } catch(e) {
            console.log("ordre -> socket.onmessage exception: " + e.toString());
        }
    };

    function performAddNodesRequest(nodesToAdd) {

        const nodesToSend = {};
        nodesToAdd.forEach(node => {
            nodesToSend[node.id] = nodeToDict(node);
        });
        const body = JSON.stringify({
            deviceId,
            nodes: nodesToSend
        });

        fetch(`${BE_URL}/middleware/add_nodes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body
        });
    };
    
    function performRemoveNodesRequest(nodesToRemove) {
    
        const nodesToSend = nodesToRemove.map(node => node.id);
        const body = JSON.stringify({
            deviceId,
            nodes: nodesToSend
        });
    
        fetch(`${BE_URL}/middleware/remove_nodes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body
        });
    }

    const analyzeIdElements = () => {
        setTimeout(() => {
            const idNodes = document.querySelectorAll('*[id]:not([id=""])');
            const nodesToAdd = [];
            let nodesToRemove = Object.keys(domIdNodesDict);
            idNodes.forEach(node => {
                const nodeId = node.id;
                if (nodeId in domIdNodesDict) {
                    nodesToRemove = nodesToRemove.filter(id => id !== nodeId);
                } else {
                    nodesToAdd.push(node);
                }
            });
            if (nodesToAdd.length > 0) {
                console.log(nodesToAdd, 'nodesToAdd');
                performAddNodesRequest(nodesToAdd);
                nodesToAdd.forEach(node => {
                    const nodeId = node.id;
                    if (!(nodeId in domIdNodesDict)) {
                        //console.log('adding ' + nodeId + ' to domIdNodesDict');
                        domIdNodesDict[nodeId] = node;
                    }
                });
            }
            if (nodesToRemove.length > 0) {
                console.log(nodesToRemove, 'nodesToRemove');
                performRemoveNodesRequest(nodesToRemove);
                nodesToRemove.forEach(node => {
                    const nodeId = node.id;
                    if (nodeId in domIdNodesDict) {
                        //console.log("removed key: " + key);
                        delete domIdNodesDict[nodeId];
                    }
                });
            }
            analyzeIdElements();
        }, 200);
    };
    analyzeIdElements();
}
