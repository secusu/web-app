(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	factory(global.Ractive.events)
}(this, function (exports) { 'use strict';

	// TODO can we just declare the keydowhHandler once? using `this`?
	function makeKeyDefinition(code, special) {
		return function (node, fire) {
			function keydownHandler(event) {
				var which = event.which || event.keyCode;

				function doAction() {
					event.preventDefault();

					fire({
						node: node,
						original: event
					});
				}

				if (which === code) {
					if (special) {
						if (event[special]) {
							doAction();
						}
					} else {
						doAction();
					}
				}
			}

			node.addEventListener('keydown', keydownHandler, false);

			return {
				teardown: function teardown() {
					node.removeEventListener('keydown', keydownHandler, false);
				}
			};
		};
	}

	var enter = makeKeyDefinition(13);
	var tab = makeKeyDefinition(9);
	var ractive_events_keys__escape = makeKeyDefinition(27);
	var space = makeKeyDefinition(32);

	var leftarrow = makeKeyDefinition(37);
	var rightarrow = makeKeyDefinition(39);
	var downarrow = makeKeyDefinition(40);
	var uparrow = makeKeyDefinition(38);

	var ctrlenter = makeKeyDefinition(13, 'ctrlKey');

	exports.enter = enter;
	exports.ctrlenter = ctrlenter;
	exports.tab = tab;
	exports.escape = ractive_events_keys__escape;
	exports.space = space;
	exports.leftarrow = leftarrow;
	exports.rightarrow = rightarrow;
	exports.downarrow = downarrow;
	exports.uparrow = uparrow;

}));