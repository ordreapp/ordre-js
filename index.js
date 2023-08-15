let initialized = false;
/*const config = { attributes: true, childList: true, subtree: true };
const observingNodes = [];*/

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
    /*let nodesToAddDict;
    let nodesToAddKeys;
    let nodesToRemoveKeys;
    let nodeId;
    let observeCallbackNotTriggeredYet = true;
    let changed;*/

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
    
        fetch("http://192.168.1.53:8000/middleware/add_nodes", {
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
    
        fetch("http://192.168.1.53:8000/middleware/remove_nodes", {
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

    /*function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const processMutations = mutationList => {

        const addToObservingNodes = node => {
            try {
                if (observingNodes.includes(node)) {
                    console.log(node, 'already exists');
                } else {
                    console.log(node, 'addToObservingNodes');
                    new MutationObserver(callback).observe(node, config);
                    observingNodes.push(node);
                }
            } catch(e) {
                console.log("ordre -> addToObservingNodes exception: " + e.toString());
            }
        }

        const recursivelyAddToObservingNodes = node => {
            try {
                addToObservingNodes(node);
                for (let children of node.children) {
                    //console.log([node, children], '[node, children]');
                    recursivelyAddToObservingNodes(children);
                }
            } catch(e) {
                console.log("ordre -> recursivelyAddToObservingNodes exception: " + e.toString());
            }
        };

        nodesToAddDict = {};
        //nodesToAdd = [];
        //nodesToAddKeys = [];
        nodesToRemoveKeys = [];
        changed = false;

        if (observeCallbackNotTriggeredYet) {
            const allElementsWithId = document.querySelectorAll('*[id]:not([id=""])');
            if (allElementsWithId.length > 0) {
                //console.log("ordre -> allElementsWithId.length: " + allElementsWithId.length);
                allElementsWithId.forEach(node => {
                    nodeId = node.id;
                    console.log("added node.id: " + node.id);
                    //addToObservingNodes(node);
                    nodesToAddDict[nodeId] = node;
                    //domIdNodesDict[nodeId] = nodeToDict(node);
                    //domIdNodes.push(nodeToDict(node));
                    //domIdNodesKeys.push(nodeId);
                });
                changed = true;
                //console.log(JSON.stringify(domIdNodes));
            }
            observeCallbackNotTriggeredYet = false;
        }

        for (const mutation of mutationList) {
            if (mutation.type === 'childList') {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        //addToObservingNodes(node);
                        recursivelyAddToObservingNodes(node);
                        nodeId = node.id;
                        if (nodeId && nodeId.length > 0 && !(nodeId in nodesToAddDict)) {
                            console.log("added node.id: " + node.id);
                            console.log(mutation.target, 'target');
                            //nodesToAdd.push(nodeToDict(node));
                            //nodesToAddKeys.push(nodeId);
                            nodesToAddDict[nodeId] = node;
                        }
                    });
                }
                if (mutation.removedNodes.length > 0) {
                    mutation.removedNodes.forEach(node => {
                        nodeId = node.id;
                        if (nodeId && nodeId.length > 0 && !(nodesToRemoveKeys.includes(nodeId))) {
                            //console.log("removed node.id: " + node.id);
                            nodesToRemoveKeys.push(nodeId);
                        }
                    });
                }
            }
        }

        nodesToAddKeys = Object.keys(nodesToAddDict);
        if (nodesToAddKeys.length > 0) {
            //console.log("nodesToAddKeys: " + nodesToAddKeys.join(", "));

            sendNewNodes(nodesToAddDict);

            nodesToAddKeys.forEach(key => {
                if (!(key in domIdNodesDict)) {
                    //console.log("added key: " + key);
                    //domIdNodesDict[key] = nodesToAdd[index];
                    domIdNodesDict[key] = nodesToAddDict[key];
                    changed = true;
                }
            });
        }
        if (nodesToRemoveKeys.length > 0) {
            //console.log("removedKeys: " + removedKeys.join(", "));

            const body = JSON.stringify({
                deviceId,
                nodes: nodesToRemoveKeys
            });

            fetch("http://192.168.1.53:8000/middleware/remove_nodes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body
            });

            nodesToRemoveKeys.forEach(key => {
                if (key in domIdNodesDict) {
                    //console.log("removed key: " + key);
                    delete domIdNodesDict[key];
                    changed = true;
                }
            });
        }
        if (changed) {
            //console.log(".");
            //console.log("ordre -> domIdNodesDict changed");
            //console.log(JSON.stringify(domIdNodesDict));
        }
    };

    const callback = async (mutationList, observer) => {
        try {
            processMutations(mutationList);
        } catch (e) {
            console.log("ordre -> MutationObserver exception: " + e.toString());
            //console.log("ordre MutationObserver exception");
        }
        //callbackIsExecuting = false;
    };

    const bodyObserver = new MutationObserver(callback)
    bodyObserver.observe(document.body, config);*/

    /*let ordreObservationStartDetectionDiv;

    const observationStartDetector = () => {
        setTimeout(() => {
            ordreObservationStartDetectionDiv = document.getElementById('ordreObservationStartDetectionDiv');
            if (ordreObservationStartDetectionDiv) {
                ordreObservationStartDetectionDiv.remove();
            } else {
                ordreObservationStartDetectionDiv = document.createElement('div');
                ordreObservationStartDetectionDiv.id = 'ordreObservationStartDetectionDiv';
                ordreObservationStartDetectionDiv.style.cssText = 'display: none;';
                document.body.appendChild(ordreObservationStartDetectionDiv);
            }
            if (observeCallbackNotTriggeredYet) {
                observationStartDetector();
            }
        }, 10);
    };
    observationStartDetector();*/

    //setTimeout(() => observer.disconnect(), 10000);
}
