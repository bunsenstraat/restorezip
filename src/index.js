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
var path = require('path')
import 'bootstrap';

let currentTheme = null


class WorkSpacePlugin extends PluginClient {

    constructor() {
        super();
        console.log("loading plugin backup zip restore")
        createClient(this);
        this.onload().then(async (x) => {
            console.log("plugin restore backup zip loaded", this)
            this.call('theme', 'currentTheme').then((theme) => {
                currentTheme = theme
                this.on("theme", "themeChanged", function (theme) {
                    // reload the page to apply the theme
                    if (currentTheme.name !== theme.name)
                        window.location.reload();
                })
            })

        });

    }
}
/* globals zip, document, URL, MouseEvent, alert */

let client = new WorkSpacePlugin()

$(function () {
    //console.log("zip")
    let files = []
    const fileInput = document.getElementById("file-input");
    fileInput.onchange = async function (event) {
        $("#log").hide()
        $("#files").show();
        //console.log(event.target.files[0])
        files = await (new ZipReader(new BlobReader(event.target.files[0]))).getEntries()
        $("#file-list").empty()
        files.forEach(render)

        function render(value, index, array) {

            if (value.filename.indexOf('.workspaces/') > -1) {
                const paths = value.filename.split(path.sep).filter((x) => x != '')
                if (paths.length === 2) {
                    let icon = ``
                    if (!value.directory)
                        icon = `<span class='fas fa-upload pr-3'></span>`
                    else
                        icon = `<span class="fas fa-folder-plus pr-3"></span>`
                    $("#file-list").append(`<li class=''><div  data-id='${index}' class='btn btn-primary mb-1 importfile'>import</div> ${paths[1]}</li>`)
                    //console.log(value.filename)
                }
            }
        }
        //console.log("done")
        //console.log(files)
    }

    $(document).on('click', '.importfile', async function (event) {
        //console.log($(event.currentTarget).attr('data-id'))
        await importfile(files[$(event.currentTarget).attr('data-id')])
    })

    const createNonClashingDirNameAsync = (workspace, workspaces) => {
        if (!workspace) workspace = 'Undefined'
        let counter = ''
        let exist = true

        do {
            const isDuplicate = workspaces.indexOf(workspace + counter) > -1

            if (isDuplicate) counter = (counter | 0) + 1
            else exist = false
        } while (exist)

        return workspace + counter
    }

    const importfile = async function (value) {
        // console.log(value)
        $("#log").show()
        const workspace = value.filename.split(path.sep).filter((x) => x != '')[1]
        const workspaces = await client.call('filePanel', 'getWorkspaces')
        const worskspacetocreate = createNonClashingDirNameAsync(workspace, workspaces)
        try {
            await client.call('filePanel', 'createWorkspace', worskspacetocreate, true)
            for (const ob of files) {
                const paths = ob.filename.split(path.sep).filter((x) => x != '')
                if (paths[1] && paths[1] === workspace && paths.length > 2) {
                    // console.log(workspace, paths, ob)
                    const finalpath = paths.slice(2).join("/")
                    if (ob.directory) {
                        try {
                            await client.call("fileManager", "mkdir", finalpath)
                            $("#log-entry").append(`<li>imported ${finalpath}  into ${worskspacetocreate}</>`)
                        } catch (e) {
                            $("#log-entry").append(`<li class='text-danger'>${e}</>`)
                        }
                    } else {
                        try {
                            let content = await (await ob.getData(new BlobWriter())).text()
                            const dir = path.dirname(ob.filename)
                            // console.log(dir)
                            await client.call("fileManager", "setFile", finalpath, content)
                            $("#log-entry").append(`<li>imported ${finalpath}  into ${worskspacetocreate}</>`)
                        } catch (e) {
                            $("#log-entry").append(`<li class='text-danger'>${e}</>`)
                        }
                    }
                }
            }
        } catch (e) {
            $("#log-entry").append(`<li class='text-danger'>${e}</>`)
        }

        return
    }

});