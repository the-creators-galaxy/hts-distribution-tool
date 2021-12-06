# Node.js Process Code

Typescript files contained within the `process` directory and its sub directories exclusively reside on the Node.js process side of this electron application.  Various methods may emit IPC marshaling compatible objects to send to the user interface via the IPC mechanism, however all processing occurs within the Node.js environment.  This code also takes a dependency on the @hashgraph/sdk (node implementation), the user interface does not.

Code in this directory may reference cod in the `common` directory.  The common directory contains definitions of primitives that are IPC marshaling friendly that can be serialized and fully supported in both the node.js process and user interface thread environments.