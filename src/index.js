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
        //console.log("CONSTRUCTOR")
        createClient(this);
        this.onload().then(async (x) => {
            //console.log("load")
        });
    }
}
/* globals zip, document, URL, MouseEvent, alert */

$(function () {


    let client = new WorkSpacePlugin()
    //console.log("zip")
    let files = []
    const fileInput = document.getElementById("file-input");
    fileInput.onchange = async function (event) {
        $("#log").hide()
        $("#files").show();
        //console.log(event.target.files[0])
        files = await (new ZipReader(new BlobReader(event.target.files[0]))).getEntries()
        //console.log(files)
        $("#file-list").empty()
        files.forEach(render)

        function render(value, index, array) {
            if (value.filename.indexOf('.workspaces') < 0) {
                let icon = ``
                if(!value.directory)
                    icon = `<span class='fas fa-upload pr-3'></span>`
                else
                    icon = `<span class="fas fa-folder-plus pr-3"></span>`
                $("#file-list").append(`<li data-id='${index}' class='importfile'>${icon}${value.filename}</li>`)
                //console.log(value.filename)
            }

        }
        //console.log("done")
        //console.log(files)
    }

    $(document).on('click', '.importfile', async function (event) {
        //console.log($(event.currentTarget).attr('data-id'))
        await importfile(files[$(event.currentTarget).attr('data-id')])
    })

    const importfile = async function(value){
        const ignore = $("#ignoreroot").val()
        const replace = `^${ignore}`;
        const re = new RegExp(replace);
        if (value.filename.indexOf('.workspaces') < 0 && value.filename != '/') {
            let filename = value.filename.replace(re, '')
            //console.log(filename)
            if (filename != '/') {
                if (value.directory) {
                    try {
                        await client.call("fileManager", "mkdir", filename)
                    } catch (e) {
                        $("#log-entry").append(`<li>${e}</>`)
                    }
                } else {
                    try {
                        let content = await (await value.getData(new BlobWriter())).text()
                        await client.call("fileManager", "setFile", filename, content)
                    } catch (e) {
                        $("#log-entry").append(`<li>${e}</>`)
                    }
                }
            }else{
                $("#log-entry").append(`<li>Ignoring ${filename}</>`)
            }
        }
    }


    $(document).on('click', '#reset', async function () {
        window.location.reload()
    })

    $(document).on('click', '#importbutton', async function () {
        //console.log("import")
        $("#wait").html("please wait")
        $("#wait").show();


        $("#log").show();
        $("#log-entry").empty()
        for (const value of files) {
            //console.log(value)
            await importfile(value)
        }
        $("#wait").html("import done")
    })

});