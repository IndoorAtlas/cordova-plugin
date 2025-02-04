/**
 * Enables tag based filtering in wayfinding routing.
 */
var WayfindingTags = function(data) {
   this.includeTags = data.includeTags || [];
   this.excludeTags = data.excludeTags || [];
   this.includeMode = data.includeMode || 'any';
   this.excludeMode = data.excludeMode || 'any';
};

WayfindingTags.Mode = {
  ANY: 'any', // tag1 || tag2 || ...
  ALL: 'all', // tag1 && tag2 && ...
};

/** all routes in graph are included and any tags are ignored */
WayfindingTags.NONE = new WayfindingTags({});
/** inaccessible routes are excluded (wayfinding graph edges with "inaccessible" tag) */
WayfindingTags.EXCLUDE_INACCESSIBLE = new WayfindingTags({excludeTags:['inaccessible']});
/** accessible-only routes are excluded (wayfinding graph edges with "accessibleonly" tag) */
WayfindingTags.EXCLUDE_ACCESSIBLE_ONLY = new WayfindingTags({excludeTags:['accessibleonly']});

module.exports = WayfindingTags;
