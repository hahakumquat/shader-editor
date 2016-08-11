/////////////////////////////////////////////////////////////////////////////////
// Copyright (c) Autodesk, Inc. All rights reserved
// Written by Philippe Leefsma 2014 - ADN/Developer Technical Services
//
// Permission to use, copy, modify, and distribute this software in
// object code form for any purpose and without fee is hereby granted,
// provided that the above copyright notice appears in all copies and
// that both that copyright notice and the limited warranty and
// restricted rights notice below appear in all supporting
// documentation.
//
// AUTODESK PROVIDES THIS PROGRAM "AS IS" AND WITH ALL FAULTS.
// AUTODESK SPECIFICALLY DISCLAIMS ANY IMPLIED WARRANTY OF
// MERCHANTABILITY OR FITNESS FOR A PARTICULAR USE.  AUTODESK, INC.
// DOES NOT WARRANT THAT THE OPERATION OF THE PROGRAM WILL BE
// UNINTERRUPTED OR ERROR FREE.
/////////////////////////////////////////////////////////////////////////////////

var defaultUrn = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6bW9kZWwyMDE2LTA2LTIxLTAwLTMyLTEwLXhybGg3enRlMGtkcDJ5anZlaWJpdWpwb2sya2kvR2F0ZUhvdXNlLm53ZA==';

$(document).ready(function () {
    var tokenurl = 'http://' + window.location.host + '/api/token';
    var config = {
        environment : 'AutodeskProduction'
	//environment : 'AutodeskStaging'
    };

    // Instantiate viewer factory
    var viewerFactory = new Autodesk.ADN.Toolkit.Viewer.AdnViewerFactory(
        tokenurl,
        config);

    // Allows different urn to be passed as url parameter
    var paramUrn = Autodesk.Viewing.Private.getParameterByName('urn');
    var urn = (paramUrn !== '' ? paramUrn : defaultUrn);

    viewerFactory.getViewablePath (urn,
                                   function(pathInfoCollection) {
                                       var viewerConfig = {
                                           viewerType: 'GuiViewer3D'
                                       };

                                       var viewer = viewerFactory.createViewer(
                                           $('#viewerDiv')[0],
                                           viewerConfig);


                                       viewer.addEventListener(
                                           Autodesk.Viewing.GEOMETRY_LOADED_EVENT,
                                           function(event) {
                                               loadExtensions(viewer);
                                           });

                                       viewer.load(pathInfoCollection.path3d[0].path);
                                   },
                                   onError);

});

function loadExtensions(viewer) {
    viewer.loadExtension("ShaderEditor");
}

function onError(error) {
    console.log('Error: ' + error);
};
