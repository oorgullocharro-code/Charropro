# Hot Paths

The audit identified three dominant paths:

1. A scoring interaction cloned and serialized the complete application state, wrote local storage, and then rebuilt the scorer DOM.
2. A suerte transition persisted a stopped zero timer before persisting navigation, causing two full state writes before the new surface became usable.
3. `getCharreadaScoringSuertes()` repeatedly resolved the same immutable rule profile and scoring definitions during a render.

The ticket keeps the existing application architecture. It removes redundant work from these paths without decomposing `js/app.js` or changing scoring semantics.
