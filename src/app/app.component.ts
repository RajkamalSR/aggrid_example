/**
 * @author Akhil K <akhil.kn@pitsolutions.com>
 */
import { Component, OnInit, ViewChild } from "@angular/core";
import { Observable } from 'rxjs/Observable';
import "ag-grid-enterprise";

import { AggridTreeEditor } from "./aggrid-tree-editor.component";

import { FileUploaderService } from './file-uploader.service';


let nextId: any;
let that: any;

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  @ViewChild('fileInput') fileInput;

  public allDisable = false;
  public files = [];
  public inputDisable;
  public attachmentData;
  public rowDataJson;
  public gridApi;
  public gridColumnApi;
  public columnDefs;
  public rowData;
  public components;
  public groupDefaultExpanded;
  public getDataPath;
  public getRowNodeId;
  public autoGroupColumnDef;
  public cellDataBeforeEdit;
  public cellDataAfterEdit;
  public frameworkComponents;
  public aggFuncs;

  public status = { 1: 'Invalid', 2: 'Valid', 3: 'Drafts', 4: 'Mixed' };

  constructor(public uploader: FileUploaderService) {
    that = this;
  }

  ngOnInit() {
    this.init();
  }

  listenQueue() {
    this.uploader.queue.subscribe((res) => {
      res.forEach((data) => {
        const gridApi = this.gridApi;
        const rowcount = gridApi.getModel().getRowCount() - 1;
        for (let i = rowcount; i >= 0; i--) {
          const node = gridApi.getDisplayedRowAtIndex(i);
          if (node['data']['dummy_id'] === data['file']['dummy_id']) {
            node.data.progress = data.progress ? data.progress : data.isError() ? 100 : 0;
            this.gridApi.refreshCells({ force: true });
            i = 0;
          }
        }
      });
      this.allDisable = !!res.filter(data => data.inProgress()).length;
    });
  }

  init() {
    this.files = [];

    this.columnDefs = [
      {
        headerName: "Size",
        field: "size",
        aggFunc: "sum",
        valueFormatter: function (params) {
          const formats = ['KB', 'MB', 'GB'];
          return Math.round(params.value / Math.pow(2, 30))
            ? Math.round(params.value / Math.pow(2, 30)) + 'GB'
            : Math.round(params.value / Math.pow(2, 20))
              ? Math.round(params.value / Math.pow(2, 20)) + 'MB'
              : Math.round(params.value / Math.pow(2, 10))
                ? Math.round(params.value / 1024) + 'KB'
                : '';
        }
      },
      {
        headerName: "Category",
        field: "category",
        editable: true,
        cellEditor: "aggridTreeEditor",
      },
      {
        headerName: "Status",
        field: "status",
        aggFunc: "stat",
        editable: params => params.data.type_id == 2,
        cellEditor: "agRichSelectCellEditor",
        cellEditorParams: (params) => { return { values: [1, 2, 3] } },
        valueFormatter: (params) => {
          return that.status[params.value];
        }
      },
      {
        headerName: "Description",
        field: "description",
        editable: true
      }
    ];
    this.aggFuncs = {
      stat: statAggFunction
    }
    this.rowData = [
      {
        "id": 1,
        "type_id": 1,
        "name": "Documentss",
        "description": "Frontend",
        "category": "",
        "unique_path": "Documents",
        "progress": "",
        "status": ""
      },
      {
        "id": 2,
        "type_id": 2,
        "name": "angular_cookbuk.txt",
        "description": "Angular 5",
        "category": "",
        "size": 1234,
        "unique_path": "Documents/angular_cookbuk.txt",
        "progress": "",
        "status": 3
      },
      {
        "id": 3,
        "type_id": 2,
        "name": "angular_cookbuk1.txt",
        "description": "Angular 5",
        "category": "",
        "size": 1234,
        "unique_path": "Documents/angular_cookbuk1.txt",
        "progress": "",
        "status": 1
      },
      {
        "id": 4,
        "type_id": 2,
        "name": "angular_cookbuk2.txt",
        "description": "Angular 5",
        "category": "",
        "size": 1234,
        "unique_path": "Documents/angular_cookbuk2.txt",
        "progress": "",
        "status": 1
      }
    ];

    this.components = {
      fileCellRenderer: getFileCellRenderer()
    };

    this.frameworkComponents = {
      aggridTreeEditor: AggridTreeEditor
    }

    this.groupDefaultExpanded = -1;

    this.getDataPath = function (data) {
      return data.unique_path.split('/');
    };

    this.getRowNodeId = function (data) {
      return data.id;
    };

    this.autoGroupColumnDef = {
      headerName: "Name",
      field: "name",
      editable: true,
      width: 250,
      cellRendererParams: {
        checkbox: true,
        suppressCount: true,
        innerRenderer: "fileCellRenderer"
      }
    };
  }

  addNewGroup(typeId: number, type: string) {
    let selectedNode = this.gridApi.getSelectedNodes()[0];
    let path = '';
    let parentId = '';
    let nodeLevel = 0;
    if (!!selectedNode) {
      path = selectedNode['data']['unique_path'] + '/';
      parentId = selectedNode['data']['id'];
      nodeLevel = selectedNode['level'] + 1;
    }
    let levelNodes = [];
    this.gridApi.forEachNode(node => (node.level === nodeLevel) && levelNodes.push(node));
    this.addNewGroupByType(type, typeId, levelNodes, parentId, path, selectedNode, type, 0);
  }

  addNewGroupByType(type, typeId, levelNodes, parentId, path, selectedNode, t, i) {
    const name = t + (i ? `(${i})` : '');
    const len = levelNodes.filter(res => res.data.name === name).length;
    if (!len) {
      let newGroupData = [{
        dummy_id: getNextId(),
        parent_id: parentId ? parentId : '',
        name: `${name}`,
        type_id: typeId,
        description: "",
        category: "",
        unique_path: `${path}${name}`,
        progress: null,
        status: 2
      }];
      this.gridApi.updateRowData({ add: newGroupData });
      this.setPayloadData();
    } else {
      this.addNewGroupByType(type, typeId, levelNodes, parentId, path, selectedNode, type, ++i);
    }
  }

  removeSelected() {
    let selectedNode = this.gridApi.getSelectedNodes()[0];
    if (!selectedNode) {
      console.warn("No nodes selected!");
      return;
    }
    getRowsToRemove(selectedNode).forEach((node) => {
      this.files = this.files.filter(res => res['dummy_id'] !== node['dummy_id']);
    });
    this.gridApi.updateRowData({ remove: getRowsToRemove(selectedNode) });
    this.setPayloadData();
  }

  setPayloadData() {
    this.rowDataJson = [];
    this.attachmentData = [];
    this.gridApi.forEachNode((node) => {
      if (!!node.data['dummy_id']) {
        this.rowDataJson.push(node.data);
        node.data['type_id'] === 2 && this.attachmentData.push(node.data);
      }
    })
  }

  onGridReady(params) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
    this.gridApi.sizeColumnsToFit();
  }

  onCellEditingStarted(params) { }

  onCellEditingStopped(params) {
    const pathIndex = params['node']['level'];
    const updateData = getRowsToRemove(params.node)
      .map((res) => {
        const data = res['unique_path'].split('/');
        data[pathIndex] = params['data']['name'];
        res['unique_path'] = data.reduce((p, c) => p + '/' + c);
        return res;
      });
    this.gridApi.updateRowData({ update: updateData });
    this.gridApi.refreshInMemoryRowModel('aggregate');
  }

  onCompleteItem($event) {
    console.log($event);
  }

  onRemoveItem($event) {
    const dummy_id = $event['item']['file']['dummy_id'];
    this.files = this.files.filter(res => res['dummy_id'] !== dummy_id);
    this.gridApi.forEachNode((node) => {
      (node['data']['dummy_id'] === dummy_id)
        ? this.gridApi.updateRowData({ remove: [node['data']] })
        : '';
    });
  }

  onSelectionChanged() {
    const selectedNode = this.gridApi.getSelectedNodes();
    this.inputDisable = false;
    this.inputDisable = selectedNode.length && selectedNode[0]['data']['type_id'] === 2;
  }

  addToQueue(el) {
    let selectedNode = this.gridApi.getSelectedNodes()[0];
    let path = '';
    let parentId = '';
    let nodeLevel = 0;
    let levelNodes = [];
    if (!!selectedNode) {
      path = selectedNode['data']['unique_path'] + '/';
      parentId = selectedNode['data']['id'];
      nodeLevel = selectedNode['level'] + 1;
    }
    this.gridApi.forEachNode(node => (node.level === nodeLevel) && levelNodes.push(node));
    const fileBrowser = this.fileInput.nativeElement;
    Array.from(fileBrowser.files).forEach((file) => {
      getFileName(file['name'], levelNodes, parentId, path, file, this.gridApi, 0);
    });
    this.setPayloadData();
    this.files = this.files.concat(Array.from(fileBrowser.files));
    el.value = '';
  }

  uploadStart() {
    this.listenQueue();
    this.uploader.uploadAll();
    this.allDisable = true;
  }
}

function getFileName(name, levelNodes, parentId, path, file, gridApi, i) {
  const [fileName, fileExtension] = file['name'].split(/\.(?=[^\.]+$)/);
  const len = levelNodes.filter(res => res.data.name === name).length;
  if (!len) {
    file['dummy_name'] = name;
    const data = {
      dummy_id: getNextId(),
      parent_id: parentId ? parentId : '',
      name: `${name}`,
      type_id: 2,
      description: "",
      category: "",
      unique_path: `${path}${name}`,
      size: file['size'],
      progress: null,
      status: 2
    };
    file['dummy_id'] = data['dummy_id'];
    gridApi.updateRowData({ add: [data] });
  } else {
    ++i;
    getFileName(`${fileName}(${i}).${fileExtension}`, levelNodes, parentId, path, file, gridApi, i);
  }
}

function getNextId() {
  nextId = !nextId ? 13 : ++nextId;
  return nextId;
}

function getFileCellRenderer() {
  function FileCellRenderer() { }
  FileCellRenderer.prototype.init = function (params) {
    let tempDiv = document.createElement("span");
    let value = params.value;
    let progress = params['data']['progress'];
    let icon = getFileIcon(params.value, params.data.type_id);
    tempDiv.innerHTML = icon
      ? `<canvas class="file-progress" data-percent="${progress}"></canvas><span class="file-text-name"><i class="${icon}"></i><span class="filename"></span>${value}</span>`
      : value;
    this.eGui = pieChartProgress(tempDiv, params['data']['type_id'], params['data']['id'], that.allDisable);
  };
  FileCellRenderer.prototype.getGui = function () {
    return this.eGui;
  };
  return FileCellRenderer;
}

function getRowsToRemove(node) {
  let res = [];
  for (let i = 0; i < node.childrenAfterGroup.length; i++) {
    res = res.concat(getRowsToRemove(node.childrenAfterGroup[i]));
  }
  return node.data ? res.concat([node.data]) : res;
}

function getFileIcon(filename, type_id) {
  return (type_id === 1)
    ? "fa fa-folder"
    : filename.endsWith(".mp3") || filename.endsWith(".wav")
      ? "fa fa-file-audio-o"
      : filename.endsWith(".xls")
        ? "fa fa-file-excel-o"
        : filename.endsWith(".doc") || filename.endsWith(".txt") || filename.endsWith(".jpg") || filename.endsWith(".png")
          ? "fa fa fa-file-o"
          : filename.endsWith(".pdf")
            ? "fa fa-file-pdf-o"
            : filename.endsWith(".wmv") || filename.endsWith(".mp4") || filename.endsWith(".mov")
              ? "fa fa-file-video-o"
              : "fa fa-file-o";
}

function pieChartProgress(el, type_id, id, enableStart) {
  const canvas = el.firstChild;
  const percent = canvas.getAttribute('data-percent');
  if (type_id === 1) {
    el.lastChild.firstChild.classList.remove('file-icon')
    el.removeChild(canvas);
    el.firstChild.classList.remove('file-text-name');
  } else if (!id && (percent != null) && !!enableStart) {
    el.lastChild.firstChild.classList.add('file-icon')
    const options: any = {
      percent: +percent ? percent : 1 / 1000,
      size: 14,
      lineWidth: 7,
      rotate: 0
    }
    const ctx = canvas.getContext('2d');
    canvas['width'] = canvas['height'] = options.size;
    ctx.translate(options['size'] / 2, options.size / 2); // change center
    ctx.rotate((-1 / 2 + options.rotate / 180) * Math.PI); // rotate -90 deg
    const radius = (options.size - options.lineWidth) / 2;
    const drawCircle = function (color, lineWidth, percent) {
      percent = Math.min(Math.max(0, percent || 1), 1);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2 * percent, false);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth
      ctx.stroke();
    };
    drawCircle('#efefef', options.lineWidth, 100 / 100);
    drawCircle('#004E70', options.lineWidth, options.percent / 100);
    if (percent == 100) {
      el.lastChild.firstChild.classList.remove('file-icon')
      el.removeChild(canvas);
      el.firstChild.classList.remove('file-text-name');
    }
  }
  return el;
}

function statAggFunction(values) {
  return  Array.from(new Set(values)).length==1?Array.from(new Set(values))[0]:4;
}