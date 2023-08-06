let initialized = false;

export function initializeOrdre(options) {
    /*if (!("clientKey" in options) || !("ordreDeviceId" in options)) {
        return;
    }
    const clientKey = options["clientKey"];
    const deviceId = options["ordreDeviceId"];*/

    if (initialized) {
        return;
    }

    console.log("initializeOrdre entered");

    initialized = true;
    let addedNodes;
    let removedNodes;
    let nodeId;

    const callback = (mutationList, observer) => {
        try {
            console.log("MutationObserver callback entered");
            addedNodes = {};
            removedNodes = {};
            for (const mutation of mutationList) {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach(node => {
                        nodeId = node.id;
                        if (nodeId && nodeId.length > 0 && !(node.id in addedNodes)) {
                            //console.log("added node.id: " + node.id);
                            addedNodes[node.id] = node;
                        }
                    });
                }
                if (mutation.removedNodes.length > 0) {
                    mutation.removedNodes.forEach(node => {
                        nodeId = node.id;
                        if (nodeId && nodeId.length > 0 && !(node.id in removedNodes)) {
                            //console.log("removed node.id: " + node.id);
                            removedNodes[node.id] = node;
                        }
                    });
                }
            }
            const addedKeys = Object.keys(addedNodes);
            if (addedKeys.length > 0) {
                console.log("addedKeys: " + addedKeys.join(", "));
            }
            const removedKeys = Object.keys(removedNodes);
            if (removedKeys.length > 0) {
                console.log("removedKeys: " + removedKeys.join(", "));
            }
        } catch (e) {
            console.log("ordre MutationObserver exception: " + e.toString());
        }
    };

    const observer = new MutationObserver(callback);

    // Options for the observer (which mutations to observe)
    const config = { attributes: false, childList: true, subtree: true };

    console.log("initializeOrdre starting to observe...");

    observer.observe(document.body, config);

    //setTimeout(() => observer.disconnect(), 10000);
}
