Ractive.events.dragndrop = function (node, fire) {

  var Drag = {
    event: function (name) {
      return function (event) {
        fire({
          node: node,
          name: name,
          type: name.split('_')[1],
          target: event.target,
          original: event
        });
      };
    }
  },
  drag_start, drag_enter, drag_over, drag_leave, drag_drop, drag_end;

  node.addEventListener('dragenter', drag_enter = Drag.event('drag_enter'));
  node.addEventListener('dragover', drag_over = Drag.event('drag_over'));
  node.addEventListener('dragleave', drag_leave = Drag.event('drag_leave'));
  node.addEventListener('drop', drag_drop = Drag.event('drag_drop'));

  return {
    teardown: function () {
      node.removeEventListener('dragenter', drag_enter);
      node.removeEventListener('dragover', drag_over);
      node.removeEventListener('dragleave', drag_leave);
      node.removeEventListener('drop', drag_drop);
    }
  };
};