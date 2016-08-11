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
        'void main() ',
        '{',
        '    gl_Position = projectionMatrix * ',
        '    modelViewMatrix * ',
        '    vec4(position, 1.0);',
        ' }'
    ].join("\r\n");    
    var fragmentText = [
        'void main() {',
        '    gl_FragColor = vec4(1., 1., 1., 1.);',
        '}'
    ].join("\r\n");
    var vertexDocument = ace.createEditSession(vertexText, "ace/mode/glsl");
    var fragmentDocument = ace.createEditSession(fragmentText, "ace/mode/glsl");
    vertexDocument.setUseWrapMode(true);
    fragmentDocument.setUseWrapMode(true);
    var mode = 0; // 0 for vertex, 1 for fragment

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

    /////////////////////////////////////////////////////////
    // Panel implementation
    //
    /////////////////////////////////////////////////////////
    Autodesk.ADN.Viewing.Extension.ShaderEditor.Panel = function(
        parentContainer, baseId) {
        
        this.content = document.createElement('div');
        
        this.content.id = baseId + 'PanelContentId';
        this.content.className = 'shadereditor-panel-content';

        Autodesk.Viewing.UI.DockingPanel.call(
            this,
            parentContainer,
            baseId,
            "Shader Editor",
            {shadow:true});

        this.container.style.top = "10px";
        this.container.style.left = "10px";
        this.container.style.width = "350px";
        this.container.style.height = "200px";
        this.container.style.resize = "auto";
        
        $('#' + baseId + 'PanelContentId').css({
            width: '100%',
            height: '98%',
        });
        editor = ace.edit(baseId + "PanelContentId");
        editor.setTheme("ace/theme/twilight");
        editor.setShowPrintMargin(false);
        var GlslMode = ace.require("ace/mode/glsl").Mode;
        editor.session.setMode(new GlslMode());
        editor.setSession(vertexDocument);
        editor.focus();
        $('#' + baseId + ".dockingPanel").prepend('<button id="editor-vertex" class="editor-button btn btn-primary btn-xs">Vertex</button>');
        $('#' + baseId + ".dockingPanel").prepend('<button id="editor-fragment" class="editor-button btn btn-primary btn-xs">Fragment</button>');
        $('#' + baseId + ".dockingPanel").prepend('<button id="editor-submit" class="editor-button btn btn-primary btn-xs">Apply</button>');
        
        $('.editor-button').css("position", "absolute");
        $('.editor-button').css("bottom", "10px");
        $('.editor-button').css("z-index", "1");
        $('#editor-submit').css("right", "10px");
        $('#editor-vertex').css("right", "137px");
        $('#editor-fragment').css("right", "62px");

        $("#editor-vertex").click(function(e) {
            mode = 0;
            editor.setSession(vertexDocument);
        });
        $("#editor-fragment").click(function(e) {
            mode = 1;
            editor.setSession(fragmentDocument);
        });
        $("#editor-submit").click(function(e) {
            if (fragId)
                setMaterial(fragId);
            else
                setMaterial(1);
        });

        editor.on("change", function(d) {
            var src = editor.session.getValue();
            // console.log(validate(src, mode));
        });
    };

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
        if (!src) {
            console.log("Shader cannot be empty");
            // this.ui.setStatus('Shader cannot be empty');
            // this.marker = session.highlightLines(0, 0);
        }
        
        var _ref = (function() {
            var details, error, i, line, lines, log, message, shader, status, _i, _len;
            try {
                shader = this.context.createShader(type);
                this.context.shaderSource(shader, source);
                this.context.compileShader(shader);
                console.log('owekfweo');
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
        }).call(this);
        console.log(_ref);
        var ok = _ref[0];
        var line = _ref[1];
        var msg = _ref[2];
        if (ok) {
            // this.viewer.updateShader(src, this.conf.mode);
            // return this.ui.setStatus('Shader successfully compiled', shdr.UI.SUCCESS);
        } else {
            line = Math.max(0, line - 1);
            // this.marker = session.highlightLines(line, line);
            // return this.ui.setStatus("Line " + line + " : " + msg, shdr.UI.ERROR);
        }
    };

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

        this.closer = this.createCloseButton();

        // this.container.appendChild(this.title);
        this.title.appendChild(this.closer);
        this.container.appendChild(this.content);

        // this.initializeMoveHandlers(this.title);
        this.initializeMoveHandlers(this.content);
        this.initializeCloseHandler(this.closer);
    };
};

Autodesk.ADN.Viewing.Extension.ShaderEditor.prototype =
    Object.create(Autodesk.Viewing.Extension.prototype);

Autodesk.ADN.Viewing.Extension.ShaderEditor.prototype.constructor =
    Autodesk.ADN.Viewing.Extension.ShaderEditor;

Autodesk.Viewing.theExtensionManager.registerExtension(
    'ShaderEditor',
    Autodesk.ADN.Viewing.Extension.ShaderEditor);
