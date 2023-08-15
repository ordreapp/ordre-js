let initialized = false;

export function startOrdre() {
    if (!("clientKey" in options) || !("deviceId" in options)) {
        console.log("startOrdre: Missing 'clientKey' or 'deviceId' parameters.");
        return;
    }
    const clientKey = options["clientKey"];
    const deviceId = options["deviceId"];

    if (initialized) {
        return;
    }

    //console.log("initializeOrdre entered");

    initialized = true;
    //let attributeName;
    //let node;
    let nodesToAddDict;
    let nodesToAddKeys;
    let nodesToRemoveKeys;
    let nodeId;
    let observeCallbackNotTriggeredYet = true;
    let domIdNodesDict = {};
    let changed;
    let callbackIsExecuting = false;

    const nodeToDict = node => {
        //const rect = node.getBoundingClientRect();
        //console.log(rect);
        return {
            tagName: node.tagName
        };
    };

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    const callback = async (mutationList, observer) => {
        try {
            while (callbackIsExecuting) {
                await sleep(1);
            }

            nodesToAddDict = {};
            //nodesToAdd = [];
            //nodesToAddKeys = [];
            nodesToRemoveKeys = [];

            callbackIsExecuting = true;
            changed = false;
            if (observeCallbackNotTriggeredYet) {
                const allElements = document.querySelectorAll('*[id]:not([id=""])');
                if (allElements.length > 0) {
                    console.log("allElements.length: " + allElements.length);
                    allElements.forEach(node => {
                        nodeId = node.id;
                        console.log("nodeId: " + nodeId);
                        nodesToAddDict[nodeId] = nodeToDict(node);
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
                            nodeId = node.id;
                            if (nodeId && nodeId.length > 0 && !(nodeId in nodesToAddDict)) {
                                //console.log("added node.id: " + node.id);
                                //nodesToAdd.push(nodeToDict(node));
                                //nodesToAddKeys.push(nodeId);
                                nodesToAddDict[nodeId] = nodeToDict(node);
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
                }/* else if (mutation.type === 'attributes') {
                    attributeName = mutation.attributeName;
                    node = mutation.target;
                    nodeId = node.id;
                    if (attributeName && nodeId && nodeId.length > 0) {
                        if (nodeId in domIdNodesDict) {
                            domIdNodesDict[nodeId][attributeName] = node[attributeName];
                            changed = true;
                        }
                    }
                }*/
            }

            nodesToAddKeys = Object.keys(nodesToAddDict);
            if (nodesToAddKeys.length > 0) {
                //console.log("nodesToAddKeys: " + nodesToAddKeys.join(", "));

                const body = JSON.stringify(nodesToAddDict);

                fetch("http://192.168.1.533:8000/device/add_nodes", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body
                });

                nodesToAddKeys.forEach(key => {
                    if (!(key in domIdNodesDict)) {
                        //console.log("added key: " + key);
                        //domIdNodesDict[key] = nodesToAdd[index];
                        domIdNodesDict[key] = nodesToAddDict[key];
                        changed = true;
                    }
                    /*if (!(domIdNodesKeys.includes(key))) {
                        console.log("added key: " + key);
                        domIdNodes.push(nodesToAdd[index]);
                        //console.log("domIdNodesKeys before");
                        //console.log(domIdNodesKeys);
                        domIdNodesKeys.push(key);
                        //console.log("domIdNodesKeys after");
                        //console.log(domIdNodesKeys);
                        changed = true;
                    }*/
                });
            }
            if (nodesToRemoveKeys.length > 0) {
                //console.log("removedKeys: " + removedKeys.join(", "));

                const body = JSON.stringify(nodesToRemoveKeys);

                fetch("http://192.168.1.533:8000/device/remove_nodes", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body
                });

                nodesToRemoveKeys.forEach(key => {
                    /*const pos = domIdNodesKeys.indexOf(key);
                    if (pos != -1) {
                        console.log("removed key: " + key);
                        domIdNodes.splice(pos, 1);
                        domIdNodesKeys.splice(pos, 1);
                    }*/
                    if (key in domIdNodesDict) {
                        //console.log("removed key: " + key);
                        delete domIdNodesDict[key];
                        changed = true;
                    }
                });
            }
            if (changed) {
                //console.log(".");
                console.log("domIdNodesDict changed");
                console.log(JSON.stringify(domIdNodesDict));
            }
        } catch (e) {
            console.log("ordre MutationObserver exception: " + e.toString());
            //console.log("ordre MutationObserver exception");
        }
        callbackIsExecuting = false;
    };

    const observer = new MutationObserver(callback);

    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: true };

    console.log("initializeOrdre starting to observe...");

    observer.observe(document, config);

    let ordreObservationStartDetectionDiv;

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
    observationStartDetector();

    //setTimeout(() => observer.disconnect(), 10000);
}
