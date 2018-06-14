import { AfterViewInit, Component, ViewChild, ViewContainerRef } from "@angular/core";

import { ICellEditorAngularComp } from "ag-grid-angular";

@Component({
  selector: 'editor-cell',
  templateUrl: './aggrid-tree-editor.component.html',
  styleUrls: ['./aggrid-tree-editor.component.css']
})

export class AggridTreeEditor implements ICellEditorAngularComp, AfterViewInit {
  private params: any;
  public gridApi;
  private val = [];

  public columnDefs = [{
    headerName: "id",
    field: "id",
    editable: true,
    hide: true
  }];

  public rowData = [
    {
      "id": 1,
      "name": "Frontend",
      "unique_path": "Software/Frontend"
    },
    {
      "id": 2,
      "name": "Backend",
      "unique_path": "Software/Backend",
    },
    {
      "id": 3,
      "name": "CRM",
      "unique_path": "Interests/CRM",
    }
  ];

  public getDataPath = function (data) {
    return data.unique_path.split('/');
  };

  public autoGroupColumnDef = {
    headerName: "Name",
    field: "name",
    editable: true,
    width: 250,
    filter: 'agTextColumnFilter',
    menuTabs: [],
    cellRendererParams: {
      suppressCount: true
    },
  };

  onGridReady(params) {
    this.gridApi = params.api;
    params.api.sizeColumnsToFit();
  }

  onSelectionChanged() {
    this.params.api.stopEditing();
  }

  ngAfterViewInit() { }

  agInit(params: any): void {
    this.params = params;
  }

  getValue(): any {
    const selectedNodes = this.gridApi.getSelectedNodes();
    let a = '';
    if (selectedNodes.length) {
      const dataArray = this.params.value.split(',');
      const index = dataArray.indexOf(selectedNodes[0]['data']['name']);
      if (index > -1) {
        dataArray.splice(index, 1);
        a = !!dataArray.length ? dataArray.reduceRight((p, c) => p + ',' + c) : '';
      } else {
        a = selectedNodes[0]['data']['name'] + ',' + this.params.value.split(',').reduceRight((p, c) => p + ',' + c);
      }
    }

    return a ? Array.from(new Set(a.replace(/,(\s+)?$/, '').split(','))).reduceRight((p, c) => p + ',' + c) : '';
  }

  isPopup(): boolean {
    return true;
  }
}