import {
    ZipReader,
    BlobReader,
    BlobWriter
} from '@zip.js/zip.js'
import {
    PluginClient
} from "@remixproject/plugin";
import {
    createClient
} from "@remixproject/plugin-webview";
import $ from "jquery";





class WorkSpacePlugin extends PluginClient {

    constructor() {
        super();
        console.log("CONSTRUCTOR")
        createClient(this);
        this.onload().then(async (x) => {
            console.log("load")
        });
    }
}
/* globals zip, document, URL, MouseEvent, alert */

$(function () {


    let client = new WorkSpacePlugin()
    console.log("zip")
    let files = []
    const fileInput = document.getElementById("file-input");
    fileInput.onchange = async function (event) {
        $("#log").hide()
        $("#files").show();
        console.log(event.target.files[0])
        files = await (new ZipReader(new BlobReader(event.target.files[0]))).getEntries()
        console.log(files)
        $("#file-list").empty()
        files.forEach(render)

        function render(value, index, array) {
            if (value.filename.indexOf('.workspaces') < 0) {

                $("#file-list").append(`<li>${value.filename}</>`)
                console.log(value.filename)
            }

        }
        console.log("done")
        console.log(files)
    }

    $(document).on('click', '#reset', async function () {
        window.location.reload()
    })

    $(document).on('click', '#importbutton', async function () {
        console.log("import")
        $("#wait").html("please wait")
        $("#wait").show();
        const ignore = $("#ignoreroot").val()
        const replace = `^${ignore}`;
        const re = new RegExp(replace);
        $("#log").show();
        $("#log-entry").empty()
        for (const value of files) {
            console.log(value)
            if (value.filename.indexOf('.workspaces') < 0 && value.filename != '/') {
                value.filename = value.filename.replace(re, '')
                console.log(value.filename)
                if (value.filename != '/') {
                    if (value.directory) {
                        try {
                            await client.call("fileManager", "mkdir", value.filename)
                        } catch (e) {
                            $("#log-entry").append(`<li>${e}</>`)
                        }
                    } else {
                        try {
                            let content = await (await value.getData(new BlobWriter())).text()
                            await client.call("fileManager", "setFile", value.filename, content)
                        } catch (e) {
                            $("#log-entry").append(`<li>${e}</>`)
                        }
                    }
                }
            }
        }
        $("#wait").html("import done")
    })

});