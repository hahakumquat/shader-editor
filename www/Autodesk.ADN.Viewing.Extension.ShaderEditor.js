var _viewer;

AutodeskNamespace("Autodesk.ADN.Viewing.Extension");

Autodesk.ADN.Viewing.Extension.ShaderEditor = function (viewer, options) {

    Autodesk.Viewing.Extension.call(this, viewer, options);

    var _panelBaseId = newGUID();
    _viewer = viewer;
    var _panel = null;
    var _this = this;
    var fragId;
    var oldMaterial;

    var editor; 
    var mode = 0; // 0 -> vertex | 1 -> fragment
    var vertexText = [
        '// See http://threejs.org/docs/api/renderers/webgl/WebGLProgram.html for variables',
        '// Default uniforms (do not add):',
        '// uniform mat4 modelMatrix;',
        '// uniform mat4 modelViewMatrix;',
        '// uniform mat4 projectionMatrix;',
        '// uniform mat4 viewMatrix;',
        '// uniform mat3 normalMatrix;',
        '// uniform vec3 cameraPosition;',
        '',
        '// Default attributes (do not add):',
        'attribute vec3 position;',
        'attribute vec3 normal;',
        'attribute vec2 uv;',
        'attribute vec2 uv2;',
        '',
        'void main() ',
        '{',
        '    gl_Position = projectionMatrix * ',
        '    modelViewMatrix * ',
        '    vec4(position, 1.0);',
        ' }'
    ].join("\r\n");      
    var fragmentText = [
        '// Default uniforms (do not add):',
        '// uniform mat4 viewMatrix;',
        '// uniform vec3 cameraPosition;',
        '',
        'void main() {',
        '    gl_FragColor = vec4(1., 1., 1., 1.);',
        '}'
    ].join("\r\n");
    var uniformText = [
        '// return object passed into THREE.ShaderMaterial uniforms field',
        'return {',
        '    time: {',
        '        value: 1.',
        '    },',
        '    resolution: {',
        '        value: new THREE.Vector2()',
        '    }',
        '}'
    ].join("\r\n");

    var vertexDocument = ace.createEditSession(vertexText, "ace/mode/glsl");
    var fragmentDocument = ace.createEditSession(fragmentText, "ace/mode/glsl");
    var uniformDocument = ace.createEditSession(uniformText, "ace/mode/javascript");
    vertexDocument.setUseWrapMode(true);
    fragmentDocument.setUseWrapMode(true);
    uniformDocument.setUseWrapMode(true);
    var mode = 0; // 0 for vertex, 1 for fragment
    var marker = null;
    var canvas = document.createElement('canvas');
    var context = canvas.getContext("webgl") || this.canvas.getContext("experimental-webgl");

    var isDragging = false;

    //////////////////////////////////////////////////////////
    // load callback
    //
    //////////////////////////////////////////////////////////
    _this.load = function () {

        _panel = new Autodesk.ADN.Viewing.Extension.ShaderEditor.Panel(
            _viewer.container,
            _panelBaseId);

        // creates controls if specified in
        _panel.setVisible(true);

        _viewer.addEventListener(
            Autodesk.Viewing.SELECTION_CHANGED_EVENT,
            _this.onSelectionChanged);

        console.log('Autodesk.ADN.Viewing.Extension.ShaderEditor loaded');

        return true;
    };

    /////////////////////////////////////////////////////////////////
    // selection changed callback
    //
    /////////////////////////////////////////////////////////////////
    _this.onSelectionChanged = function (event) {

        // event is triggered also when component is unselected

        // in that case event.dbIdArray is an empty array
        if(event.fragIdsArray.length) {
            if (fragId) {
                _viewer.model.getFragmentList().setMaterial(fragId, oldMaterial);
            }
            fragId = event.fragIdsArray[0];
            oldMaterial = _viewer.impl.getRenderProxy(_viewer.model, fragId).material;
        }
    }

    /////////////////////////////////////////////////////////
    // unload callback
    //
    /////////////////////////////////////////////////////////
    _this.unload = function () {

        _panel.setVisible(false);

        console.log('Autodesk.ADN.Viewing.Extension.ShaderEditor unloaded');

        return true;
    };

    /////////////////////////////////////////////////////////
    // Panel implementation
    //
    /////////////////////////////////////////////////////////
    Autodesk.ADN.Viewing.Extension.ShaderEditor.Panel = function(
        parentContainer, baseId) {
        
        this.content = document.createElement('div');
        
        this.content.id = baseId + 'shaderEditorContent';
        this.content.className = 'shadereditor-content';

        Autodesk.Viewing.UI.DockingPanel.call(
            this,
            parentContainer,
            baseId,
            "Shader Editor",
            {shadow:true});

        this.container.style.top = "10px";
        this.container.style.left = "10px";
        this.container.style.width = "450px";
        this.container.style.height = "300px";
        this.container.style.resize = "auto";

        $("#" + baseId + "shaderEditorContent").css({
            width: "100%",
            height: "calc(100% - 45px)",
            position: "relative"
        });
        $("#" + baseId + "shaderEditorContent").append("<div id='shaderContainer'></div>");
        $("#shaderContainer").css({
            position: "relative",
            width: "100%",
            height: "calc(100% - 34px)",
            top: 0,
            left: 0,
            right: 0,
            bottom: "24px"
        });
        
        $('#' + baseId + "shaderEditorContent").append('<button id="editor-submit" class="editor-button btn btn-xs">Apply</button>');
        $('#' + baseId + "shaderEditorContent").append('<button id="editor-fragment" class="editor-button btn btn-xs">Fragment</button>');
        $('#' + baseId + "shaderEditorContent").append('<button id="editor-vertex" class="editor-button btn btn-xs">Vertex</button>');
        $('#' + baseId + "shaderEditorContent").append('<button id="editor-uniform" class="editor-button btn btn-xs">Uniforms</button>');
        $("#" + baseId + "shaderEditorContent").append('<div id="editor-log"></div>');

        $(".editor-button").css({
            'margin-left': '2px',
            'margin-right': '2px',
            float: 'right'
        });

        $("#editor-log").css({
            color: 'white',
            height: '24px',
            margin: '2 2 2 2'
        });

        editor = genEditor(baseId, this);
    };

    function genEditor(baseId, panel) {
        
        var editor = ace.edit("shaderContainer");
        editor.setTheme("ace/theme/twilight");
        editor.setShowPrintMargin(false);
        editor.setAutoScrollEditorIntoView(true);
        editor.setSession(vertexDocument);

        $("#editor-uniform").click(function(e) {
            mode = 2;
            $("#editor-log").html("");
            editor.setSession(uniformDocument);
            editor.focus();
        });
        $("#editor-vertex").click(function(e) {
            mode = 0;
            $("#editor-log").html("");
            editor.setSession(vertexDocument);
            editor.focus();
        });
        $("#editor-fragment").click(function(e) {
            mode = 1;
            $("#editor-log").html("");
            editor.setSession(fragmentDocument);
            editor.focus();
        });
        $("#editor-submit").click(function(e) {
            if (fragId)
                setMaterial(fragId);
            else {
                fragId = 1;
                oldMaterial = _viewer.impl.getRenderProxy(_viewer.model, fragId).material;
                setMaterial(fragId);
            }
        });
        editor.on("change", function(d) {
            if (marker != null) {
                editor.getSession().removeMarker(marker.id);
            }
            var src = editor.session.getValue();
            var res = validate(src, mode);
            displayError(res);
        });

        // hack for getting panel resize
        $("#" + baseId)
            .mousedown(function() {
                isDragging = false;
            })
            .mousemove(function() {
                var wasDragging = isDragging;
                isDragging = true;
                if (wasDragging)
                    editor.resize();
            })
            .mouseup(function() {
                var wasDragging = isDragging;
                isDragging = false;
                if (!wasDragging) {
                    editor.resize();
                }
            });
        
        return editor;
    }

    function displayError(res) {
        if (res !== false) {
            var ok = res[0];
            var line = res[1];
            var err = res[2];
            if (!ok) {
                marker = editor.getSession().highlightLines(Math.max(0, line - 1), Math.max(0, line - 1));
                $("#editor-log").html("Line " + res[1] + ", " + res[2]);
                // $("#editor-submit").prop("disabled", true);
            }
            else {
                $("#editor-log").html("");
                // $("#editor-submit").prop("disabled", false);
            }
        }
    }

    function setMaterial(fragId) {

        var material = new THREE.ShaderMaterial({
            vertexShader: vertexDocument.getValue(),
            fragmentShader: fragmentDocument.getValue(),
            side: THREE.DoubleSide
        });

        _viewer.impl.matman().removeMaterial("shaderMaterial");
        _viewer.impl.matman().addMaterial("shaderMaterial", material, true);
        _viewer.model.getFragmentList().setMaterial(fragId, material);
        _viewer.impl.invalidate(true);
    }

    function validate(src, type) {
        if (type == 2) {
            return false;
        }
        if (!src) {
            return [false, 0, "Shader cannot be empty"];
        }
        if (!context) {
            console.warn("No WebGL context.");
        }
        var details, error, i, line, lines, log, message, shader, status, _i, _len;
        try {
            var shaderType = type === 0 ? context.VERTEX_SHADER : context.FRAGMENT_SHADER;
            shader = context.createShader(shaderType);
            context.shaderSource(shader, src);
            context.compileShader(shader);
            status = context.getShaderParameter(shader, context.COMPILE_STATUS);
        }
        catch(e) {
            return [false, 0, e.getMessage];
        }
        if (status === true) {
            return [true, null, null];
        }
        else {
            log = context.getShaderInfoLog(shader);
            // remove undeclared three.js stuff
            var filterLog = log;
            lines = filterLog.split('\n');
            for (_i = 0, _len = lines.length; _i < _len; _i++) {
                i = lines[_i];
                if (i.substr(0, 5) === 'ERROR') {
                    if (i.indexOf("undeclared identifier") > -1) {
                        if (i.indexOf("projectionMatrix") > -1 ||
                            i.indexOf("modelMatrix") > -1 ||
                            i.indexOf("modelViewMatrix") > -1 ||
                            i.indexOf("viewMatrix") > -1 ||
                            i.indexOf("cameraPosition") > -1 ||
                            i.indexOf("normal") > -1 ||
                            i.indexOf("uv") > -1 ||
                            i.indexOf("uv2") > -1 ||
                            i.indexOf("position") > -1) {
                            lines.splice(_i, 1);
                            _i--;
                            _len--;
                        }
                    }
                    else if (i.indexOf("No precision specified for (float)") > -1) {
                        lines.splice(_i, 1);
                        _i--;
                        _len--;
                    }
                    else if (i.indexOf("'constructor' : not enough data provided for construction") > -1) {
                        lines.splice(_i, 1);
                        _i--;
                        _len--;
                    }
                }
            }
            for (_i = 0, _len = lines.length; _i < _len; _i++) {
                i = lines[_i];
                if (i.substr(0, 5) === 'ERROR') {
                    error = i;
                }
            }
            if (!error || error[0] === "") {
                return [true, null, null];
                // return [false, 0, 'Unable to parse error.'];
            }
            details = error.split(':');
            if (details.length < 4) {
                return [false, 0, error];
            }
            line = details[2];
            message = details.splice(3).join(':');
            return [false, parseInt(line), message];
        }
    }

    Autodesk.ADN.Viewing.Extension.ShaderEditor.Panel.prototype = Object.create(
        Autodesk.Viewing.UI.DockingPanel.prototype);

    Autodesk.ADN.Viewing.Extension.ShaderEditor.Panel.prototype.constructor =
        Autodesk.ADN.Viewing.Extension.ShaderEditor.Panel;

    Autodesk.ADN.Viewing.Extension.ShaderEditor.Panel.prototype.initialize = function()
    {
        // Override DockingPanel initialize() to:
        // - create a standard title bar
        // - click anywhere on the panel to move

        this.title = this.createTitleBar(
            this.titleLabel ||
                this.container.id);
        $(this.title).attr("id", "editor-title");

        this.closer = this.createCloseButton();

        this.container.appendChild(this.title);
        this.title.appendChild(this.closer);
        this.container.appendChild(this.content);

        this.initializeMoveHandlers(this.title);
        // this.initializeMoveHandlers(this.content);
        this.initializeCloseHandler(this.closer);
        
    };

    /////////////////////////////////////////////////////////
    // new GUID util
    //
    /////////////////////////////////////////////////////////
    function newGUID() {

        var d = new Date().getTime();

        var guid = 'xxxx-xxxx-xxxx-xxxx-xxxx'.replace(
                /[xy]/g,
            function (c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
            });

        return guid;
    };


};

Autodesk.ADN.Viewing.Extension.ShaderEditor.prototype =
    Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.ShaderEditor.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.ShaderEditor;

Autodesk.Viewing.theExtensionManager.registerExtension(
    'ShaderEditor',
    Autodesk.ADN.Viewing.Extension.ShaderEditor);
