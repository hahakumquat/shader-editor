(function() {

  Validator = (function() {

    Validator.FRAGMENT = null;

    Validator.VERTEX = null;

    function Validator(canvas) {
      this.canvas = canvas;
      this.available = true;
      if (!this.canvas) {
        this.canvas = document.createElement('Canvas');
      }
      try {
        this.context = canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");
      } catch (e) {
        console.log(e);
      }
      if (!this.context) {
        this.available = false;
        console.warn('GLSL Validator: No WebGL context.');
      } else {
        Validator.FRAGMENT = this.context.FRAGMENT_SHADER;
        Validator.VERTEX = this.context.VERTEX_SHADER;
      }
    }

    Validator.prototype.validate = function(source, type) {
      var details, error, i, line, lines, log, message, shader, status, _i, _len;
      if (type == null) {
        type = Validator.FRAGMENT;
      }
      if (!this.available || !source) {
        return [true, null, null];
      }
      try {
        shader = this.context.createShader(type);
        this.context.shaderSource(shader, source);
        this.context.compileShader(shader);
        status = this.context.getShaderParameter(shader, this.context.COMPILE_STATUS);
      } catch (e) {
        return [false, 0, e.getMessage];
      }
      if (status === true) {
        return [true, null, null];
      } else {
        log = this.context.getShaderInfoLog(shader);
        this.context.deleteShader(shader);
        lines = log.split('\n');
        for (_i = 0, _len = lines.length; _i < _len; _i++) {
          i = lines[_i];
          if (i.substr(0, 5) === 'ERROR') {
            error = i;
          }
        }
        if (!error) {
          return [false, 0, 'Unable to parse error.'];
        }
        details = error.split(':');
        if (details.length < 4) {
          return [false, 0, error];
        }
        line = details[2];
        message = details.splice(3).join(':');
        return [false, parseInt(line), message];
      }
    };

    return Validator;

  })();

}).call(this);
