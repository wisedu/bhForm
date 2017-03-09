/**
     * @memberof module:WIS_EMAP_INPUT
     * @description 表单控件注册对象
     * @prop {Object} select - 单选下拉，基于jqxDropdownList 封装
     * @prop {Object} multi-select2 - 多选下拉， 基于jqxDropdownList封装
     * @prop {Object} multi-select - 旧版多选下拉， 基于jqxCombobox封装，不推荐使用
     * @prop {Object} selecttable - 下拉表格/模糊搜索， 基于jqxCombobox封装
     * @prop {Object} date-ym - 年月选择框,基于jqxDateTimeInput封装， 默认 yyyy-MM
     * @prop {Object} date-local - 日期选择框,基于jqxDateTimeInput封装， 默认 yyyy-MM-dd
     * @prop {Object} date-full - 日期时间选择框,基于jqxDateTimeInput封装， 默认 yyyy-MM-dd HH:mm
     * @prop {Object} date-range - 日期范围选择, 只能在高级搜索中使用，基于jqxDateTimeInput封装， 默认 yyyy-MM-dd
     * @prop {Object} radiolist - 单选按钮组
     * @prop {Object} checkboxlist - 多选按钮组
     * @prop {Object} tree - 单选下拉树
     * @prop {Object} multi-tree - 多选下拉树
     * @prop {Object} switcher - 开关， 基于jqxSwitcheButton封装
     * @prop {Object} buttonlist - 单选按钮组
     * @prop {Object} multi-buttonlist - 多选按钮组
     * @prop {Object} textarea - 计数文本域，基于bhTxtInput封装
     * @prop {Object} number - 数字文本框，基于jqxNumberInput封装
     * @prop {Object} number-range - 数字区间，基于jqxNumberInput封装
     * @prop {Object} uploadfile - 文件上传，基于emapFileUpload封装
     * @prop {Object} uploadsingleimage - 单图片上传，基于emapSingleFileUpload封装
     * @prop {Object} uploadmuiltimage - 多图片上传，基于emapFileUpload封装
     * @prop {Object} text - 文本
     * @prop {Object} div - div占位
     * @prop {Object} static - 表单静态字段
     */
    WIS_EMAP_INPUT.core = {
        // 下拉框
        "select": {
            "init": _initSelect,
            "setValue": function (ele, name, val, root) {
                if (val[name] === undefined || val[name] === null) {
                    // 清空字段
                    ele.jqxDropDownList('clearSelection');
                    return;
                }

                if (ele.jqxDropDownList('getItemByValue', val[name])) {
                    _setSelectValue(ele, val[name]);
                } else {
                    if (val[name + '_DISPLAY']) {
                        ele.jqxDropDownList('addItem', {
                            id: val[name],
                            name: val[name + '_DISPLAY']
                        });
                        _setSelectValue(ele, val[name]);
                    } else {
                        WIS_EMAP_INPUT.getInputOptions(ele.data("url"), function (res) {
                            ele.jqxDropDownList('clear');
                            $(res).each(function () {
                                ele.jqxDropDownList('addItem', this);
                            });
                            _setSelectValue(ele, val[name]);
                            ele.data('loaded', true);
                        });
                    }
                }
            },
            "getValue": function (ele, formData) {
                var item = ele.jqxDropDownList('getSelectedItem');
                if (item) {
                    formData[ele.data('name') + "_DISPLAY"] = item.label;
                }
                return ele.val();
            },
            "disable": function (ele) {
                ele.jqxDropDownList({
                    disabled: true
                });
            },
            "enable": function (ele) {
                ele.jqxDropDownList({
                    disabled: false
                });
            }
        },

        "multi-select2": {
            "init": _initSelect,
            "setValue": function (ele, name, val, root) {
                if (val[name] === undefined || val[name] === null) {
                    // 清空字段
                    ele.jqxDropDownList('uncheckAll');
                    return;
                }
                var select2ValueArr = val[name].split(',');
                if (val[name + '_DISPLAY'] === undefined || val[name + '_DISPLAY'] === null) {
                    WIS_EMAP_INPUT.getInputOptions(ele.data("url"), function (res) {
                        if (!ele.data('loaded')) {
                            $(res).each(function () {
                                ele.jqxDropDownList('addItem', this);
                            });
                            ele.data('loaded', true);
                        }

                        select2ValueArr.map(function (val) {
                            ele.jqxDropDownList('checkItem', val);
                        })
                    });
                    return;
                }

                var select2DisplayArr = val[name + '_DISPLAY'].split(',');

                $(select2ValueArr).each(function (i) {
                    if (ele.jqxDropDownList('getItemByValue', select2ValueArr[i])) {
                        ele.jqxDropDownList('checkItem', select2ValueArr[i]);
                    } else {
                        ele.jqxDropDownList('addItem', {
                            id: select2ValueArr[i],
                            name: select2DisplayArr[i]
                        });
                        ele.jqxDropDownList('checkItem', select2ValueArr[i]);
                    }
                });
            },
            "getValue": function (ele, formData) {
                var items = ele.jqxDropDownList('getCheckedItems');
                if (items && items.length > 0) {
                    formData[ele.data('name') + "_DISPLAY"] = items.map(function (val) {
                        return val.label;
                    }).join(',');
                }
                return ele.val() === undefined ? "" : ele.val();
            },
            "disable": function (ele) {
                ele.jqxDropDownList({
                    disabled: true
                });
            },
            "enable": function (ele) {
                ele.jqxDropDownList({
                    disabled: false
                });
            }
        },

        "multi-select": {
            "init": function (ele, params) {
                var _this = ele;
                //qiyu 2016-11-19 将获取mock的url提取函数，在mock文件中重新定义
                var source = {
                    url: _this.data("url"),
                    datatype: "json",
                    root: "datas>code>rows",
                    beforeLoadComplete: function (records) {
                        if (!_this.data('initdata')) {
                            _this.data('initdata', records);
                        }
                        return records;
                    },
                    formatData: function (data) {
                        data.pageSize = 10;
                        data.pageNumber = 1;
                        data.queryopt = JSON.stringify({
                            "name": "name",
                            "value": _this.jqxComboBox('searchString'),
                            "builder": "include",
                            "linkOpt": "AND"
                        });
                        return data;
                    }
                };
                if (typeof window.MOCK_CONFIG != 'undefined') {
                    source = getSourceMock(source);
                }
                var dataAdapter = new $.jqx.dataAdapter(source);

                // var dataAdapter = new $.jqx.dataAdapter({
                //     url: _this.data("url"),
                //     datatype: "json",
                //     root: "datas>code>rows",
                //     beforeLoadComplete: function(records) {
                //         if (!_this.data('initdata')) {
                //             _this.data('initdata', records);
                //         }
                //         return records;
                //     },
                //     formatData: function(data) {
                //         data.pageSize = 10;
                //         data.pageNumber = 1;
                //         data.queryopt = JSON.stringify({
                //             "name": "name",
                //             "value": _this.jqxComboBox('searchString'),
                //             "builder": "include",
                //             "linkOpt": "AND"
                //         });
                //         return data;
                //     }

                // });
                var inputOptions = $.extend({}, {
                    placeHolder: '请选择...',
                    source: dataAdapter,
                    displayMember: "name",
                    multiSelect: true,
                    remoteAutoComplete: true,
                    // autoDropDownHeight: true,
                    enableBrowserBoundsDetection: true,
                    valueMember: "id",
                    minLength: 1,
                    width: "100%",
                    height: "26px",
                    disabled: _this.data('disabled') ? true : false,
                    search: function (searchString) {
                        dataAdapter.dataBind();
                    }
                }, params);
                _this.jqxComboBox(inputOptions)
                    .on('keyup open', 'input.jqx-combobox-input', function () {
                        // .on('keyup', 'input.jqx-combobox-input', function () {
                        var value = $(this).val();
                        var items = _this.jqxComboBox('getItems');
                        if (value == "" && (!items || items.length == 0)) {
                            // if (value == "" && _this.jqxComboBox('getItems').length == 0) {
                            var initData = _this.data('initdata');
                            $(initData).each(function () {
                                _this.jqxComboBox('addItem', this);
                            });
                        }
                    });
                _triggerFormChange(_this, 'select');
                dataAdapter.dataBind();
            },
            "setValue": function (ele, name, val, root) {
                if (val[name] === undefined || val[name] === null) {
                    // 清空字段
                    ele.jqxComboBox('clearSelection');
                    return;
                }

                if (val[name + '_DISPLAY'] !== undefined && val[name + '_DISPLAY'] !== null) {
                    var currentArr = ele.jqxComboBox('getItems').map(function (value) {
                        return value.value;
                    });
                    var displayVal = val[name + '_DISPLAY'].split(',');
                    val[name].split(',').map(function (v, i) {
                        if ($.inArray(v, currentArr) < 0) {
                            ele.jqxComboBox('addItem', {
                                id: v,
                                name: displayVal[i]
                            });
                        }
                        ele.jqxComboBox('selectItem', v);
                    });
                } else {
                    if (val[name] === undefined || val[name] === null) {
                        // 清空表单的情况
                        ele.jqxComboBox('clearSelection');
                    } else {
                        WIS_EMAP_INPUT.getInputOptions(ele.data("url"), function (res) {
                            ele.data('model', res);
                            var valueArr = val[name].split(',');
                            var currentArr = ele.jqxComboBox('getItems').map(function (val) {
                                return val.value;
                            });
                            $(res).each(function () {
                                if ($.inArray(this.id, valueArr) > -1) {
                                    if ($.inArray(this.id, currentArr) < 0) {
                                        ele.jqxComboBox('addItem', this);
                                    }
                                    ele.jqxComboBox('selectItem', this.id);
                                }
                            });
                        });
                    }
                }
            },
            "getValue": function (ele, formData) {
                var valueArray = [],
                    displayArray = [];
                $(ele.jqxComboBox('getSelectedItems')).each(function () {
                    valueArray.push(this.value);
                    displayArray.push(this.label);
                });
                formData[ele.data('name') + "_DISPLAY"] = displayArray.join(',');
                return valueArray.join(',');
            },
            "disable": function (ele) {
                ele.jqxComboBox({
                    disabled: true
                });
            },
            "enable": function (ele) {
                ele.jqxComboBox({
                    disabled: false
                });
            }
        },

        "selecttable": {
            "init": function (ele, params) {
                var inputOptions = $.extend({}, {
                    url: ele.data('url'),
                    width: '100%'
                }, params);
                ele.emapDropdownTable(inputOptions);
                _triggerFormChange(ele, 'select');
            },
            "setValue": function (ele, name, val, root) {
                ele.emapDropdownTable('setValue', [val[name], val[name + '_DISPLAY']]);
            },
            "getValue": function (ele, formData) {
                formData[ele.data('name') + '_DISPLAY'] = ele.emapDropdownTable('getText');
                return ele.emapDropdownTable('getValue');
                // return ele.val();
            },
            "disable": function (ele) {
                ele.jqxComboBox({
                    disabled: true
                });
            },
            "enable": function (ele) {
                ele.jqxComboBox({
                    disabled: false
                });
            }
        },

        "date-ym": {
            "init": _initDateInput,
            "setValue": _setTextValue,
            "getValue": function (ele, formData) {
                return ele.val();
            },
            "disable": function (ele) {
                ele.jqxDateTimeInput({
                    disabled: true
                });
            },
            "enable": function (ele) {
                ele.jqxDateTimeInput({
                    disabled: false
                });
            }
        },

        "date-local": {
            "init": _initDateInput,
            "setValue": _setTextValue,
            "disable": function (ele) {
                ele.jqxDateTimeInput({
                    disabled: true
                });
            },
            "getValue": function (ele, formData) {
                return ele.val();
            },
            "enable": function (ele) {
                ele.jqxDateTimeInput({
                    disabled: false
                });
            }
        },

        "date-full": {
            "init": _initDateInput,
            "setValue": _setTextValue,
            "getValue": function (ele, formData) {
                return ele.val();
            },
            "disable": function (ele) {
                ele.jqxDateTimeInput({
                    disabled: true
                });
            },
            "enable": function (ele) {
                ele.jqxDateTimeInput({
                    disabled: false
                });
            }
        },

        "date-range": {
            "init": function (ele, params) {
                // range: {//可选，设置时间可选的范围
                //     max: 'today',  //可选，设置时间的最大可选范围，可传入'today'表示今天，或传入时间字符串，格式如'2015/02/05'
                //     min: '2015/02/05' //可选，设置时间的最小可选范围，可传入'today'表示今天，或传入时间字符串，格式如'2015/02/05'
                // },
                // time:{//可选，初始化时显示的时间范围
                //     start: '2015/01/05', //必填，时间字符串，格式如'2015/02/05'
                //     end: '2015/06/01'//必填，时间字符串，格式如'2015/02/05'
                // },
                // selected: function(startTime, endTime){ //可选，选择时间后的回调，返回的参数startTime是选择的开始时间，endTime是选择的结束时间，返回的是时间字符串格式如'2015/02/05'
                // }
                var inputOptions = $.extend({}, {
                    format: ele.data('format')
                }, params);

                ele.bhTimePicker(inputOptions);

                // TODO 需要 _formChange 事件触发
            },
            "setValue": function (ele, name, val, root) {
                if (val === '' || val === undefined || val[name] === "") {
                    ele.bhTimePicker('setType', 'all');
                } else {
                    var val_arr = val[name].split(',');
                    if (val_arr.length == 2) {
                        ele.bhTimePicker('setType', 'custom');
                        ele.bhTimePicker('setValue', {
                            startTime: val_arr[0],
                            endTime: val_arr[1]
                        });
                    }
                }
            },
            "getValue": function (ele, formData) {
                var rangeValue = ele.bhTimePicker('getValue');
                var sValue = (rangeValue.startTime || '') + ',' + (rangeValue.endTime || '');
                return sValue === ',' ? '' : sValue;
            },
            "disable": _defaultDisabled,
            "enable": _defaultEnable
        },

        "radiolist": {
            "init": function (ele, params) {
                if (ele.data('init')) {
                    return;
                }

                if (ele.data('optiondata')) {
                    var option_data = ele.data('optiondata');
                    if (typeof option_data == 'string') {
                        try {
                            option_data = JSON.parse(option_data);
                        } catch (e) {
                            console && console.error(_this.data('name') + 'optionData 格式错误, 必须是json格式');
                        }
                    } else {
                        option_data = WIS_EMAP_SERV.cloneObj(option_data)
                    }
                    _renderHtml(option_data, ele);
                    return
                }

                //qiyu 2016-11-19 将获取mock的url提取函数，在mock文件中重新定义
                var source = {
                    url: ele.data("url"),
                    datatype: "json",
                    async: false,
                    root: "datas>code>rows"
                };
                if (typeof window.MOCK_CONFIG != 'undefined') {
                    source = getSourceMock(source);
                }
                var dataAdapter = new $.jqx.dataAdapter(source, {
                    loadComplete: function (records) {
                        var random = '_' + parseInt(Math.random() * 100000);
                        _renderHtml(records.datas.code.rows, ele);
                    }
                });
                dataAdapter.dataBind();
                _triggerFormChange(ele, 'change');

                function _renderHtml(data, ele) {
                    var listHtml = '';
                    $(data).each(function () {
                        listHtml += '<label>' +
                            '<input type="radio" name="' + ele.data('name') + '" value="' + this.id + '" data-caption="' + this.name + '" />' +
                            '<i class="bh-choice-helper"></i>' + this.name +
                            '</label>';
                    });
                    ele.html(listHtml).data('init', true).trigger('bhInputInitComplete');
                }
            },
            "setValue": function (ele, name, val, root) {
                if (val[name] !== undefined && val[name] !== null && val[name] !== "") {
                    $('input[type=radio][value=' + val[name] + ']', ele).prop('checked', true);
                } else {
                    $('input[type=radio]', ele).prop('checked', false);
                }
            },
            "getValue": function (ele, formData) {
                var itemText = ele.find('input[type=radio]:checked').map(function () {
                    return $(this).data('caption');
                }).get().join(',');
                formData[ele.data('name') + "_DISPLAY"] = itemText;
                return ele.find('input[type=radio]:checked').map(function () {
                    return $(this).val();
                }).get().join(',');
            },
            "disable": function (ele) {
                $('input[type=radio]', ele).prop('disabled', true);
            },
            "enable": function (ele) {
                $('input[type=radio]', ele).prop('disabled', false);
            }
        },

        "checkboxlist": {
            "init": function (ele, params) {
                if (ele.data('init')) {
                    return;
                }

                if (ele.data('optiondata')) {
                    var option_data = ele.data('optiondata');
                    if (typeof option_data == 'string') {
                        try {
                            option_data = JSON.parse(option_data);
                        } catch (e) {
                            console && console.error(_this.data('name') + 'optionData 格式错误, 必须是json格式');
                        }
                    } else {
                        option_data = WIS_EMAP_SERV.cloneObj(option_data)
                    }
                    _renderHtml(option_data, ele);
                    return
                }

                //qiyu 2016-11-19 将获取mock的url提取函数，在mock文件中重新定义
                var source = {
                    url: ele.data("url"),
                    datatype: "json",
                    async: false,
                    root: "datas>code>rows"
                };
                if (typeof window.MOCK_CONFIG != 'undefined') {
                    source = getSourceMock(source);
                }
                var dataAdapter = new $.jqx.dataAdapter(source, {
                    loadComplete: function (records) {
                        var random = '_' + parseInt(Math.random() * 1000);
                        _renderHtml(records.datas.code.rows, ele);
                        // $(records.datas.code.rows).each(function () {
                        //  listHtml += '<label>' +
                        //          '<input type="checkbox" name="' + ele.data('name') + '" value="' + this.id + '" data-caption="' + this.name + '" />' +
                        //          '<i class="bh-choice-helper"></i>' + this.name +
                        //          '</label>';
                        // });
                        // ele.html(listHtml).data('init', true);
                    }
                });

                // var dataAdapter = new $.jqx.dataAdapter({
                //     url: ele.data("url"),
                //     datatype: "json",
                //     async: false,
                //     root: "datas>code>rows"
                // }, {
                //     loadComplete: function(records) {
                //         var random = '_' + parseInt(Math.random() * 1000);
                //         _renderHtml(records.datas.code.rows, ele);
                //         // $(records.datas.code.rows).each(function () {
                //         //  listHtml += '<label>' +
                //         //          '<input type="checkbox" name="' + ele.data('name') + '" value="' + this.id + '" data-caption="' + this.name + '" />' +
                //         //          '<i class="bh-choice-helper"></i>' + this.name +
                //         //          '</label>';
                //         // });
                //         // ele.html(listHtml).data('init', true);
                //     }
                // });
                dataAdapter.dataBind();
                _triggerFormChange(ele, 'change');

                function _renderHtml(data, ele) {
                    var listHtml = '';
                    $(data).each(function () {
                        listHtml += '<label>' +
                            '<input type="checkbox" name="' + ele.data('name') + '" value="' + this.id + '" data-caption="' + this.name + '" />' +
                            '<i class="bh-choice-helper"></i>' + this.name +
                            '</label>';
                    });
                    ele.html(listHtml).data('init', true).trigger('bhInputInitComplete');
                }
            },
            "setValue": function (ele, name, val, root) {
                if (val[name] !== undefined && val[name] !== null && val[name] !== "") {
                    $(val[name].toString().split(',')).each(function () {
                        $('input[type=checkbox][value="' + this + '"]', ele).prop('checked', true);
                    });
                } else {
                    $('input[type=checkbox]', ele).prop('checked', false);
                }
                ele.emapRepeater('setValue', val[name]);
            },
            "getValue": function (ele, formData) {
                var itemText = ele.find('input[type=checkbox]:checked').map(function () {
                    return $(this).data('caption');
                }).get().join(',');
                formData[ele.data('name') + "_DISPLAY"] = itemText;
                return ele.find('input[type=checkbox]:checked').map(function () {
                    return $(this).val();
                }).get().join(',');
            },
            "disable": function (ele) {
                $('input[type=checkbox]', ele).prop('disabled', true);
            },
            "enable": function (ele) {
                $('input[type=checkbox]', ele).prop('disabled', false);
            }
        },

        "tree": {
            "init": _initTree,
            "setValue": function (ele, name, val, root) {
                //qiyu 2016-1-16
                if (val[name] === undefined || val[name] === null) {
                    // 清空下拉树 zhuhui 5-24
                    ele.emapDropdownTree("setValue", ['', '请选择...']);
                    return;
                }

                if (val[name + '_DISPLAY']) {
                    ele.emapDropdownTree("setValue", [val[name], val[name + "_DISPLAY"]]);
                } else {
                    WIS_EMAP_INPUT.getInputOptions(ele.data("url"), function (res) {
                        ele.data('model', res);
                        $(res).each(function () {
                            if (this.id == val[name]) {
                                ele.emapDropdownTree("setValue", [this.id, this.name]);
                                return false;
                            }
                        });
                    });
                }
            },
            "getValue": function (ele, formData) {
                formData[ele.data('name') + "_DISPLAY"] = ele.emapDropdownTree('getText');
                return ele.emapDropdownTree('getValue');
            },
            "disable": function (ele) {
                ele.emapDropdownTree('disable');
            },
            "enable": function (ele) {
                ele.emapDropdownTree('enable');
            }
        },

        "multi-tree": {
            "init": _initTree,
            "setValue": function (ele, name, val, root) {
                //qiyu 2016-1-16
                if (val[name] === undefined || val[name] === null) {
                    // 清空下拉树 zhuhui 5-24
                    ele.emapDropdownTree("setValue", ['', '请选择...']);
                    return;
                }
                ele.emapDropdownTree("setValue", [val[name], val[name + "_DISPLAY"]]);

            },
            "getValue": function (ele, formData) {
                formData[ele.data('name') + "_DISPLAY"] = ele.emapDropdownTree('getText');
                return ele.emapDropdownTree('getValue');
            },
            "disable": _defaultDisabled,
            "enable": _defaultEnable
        },

        "switcher": {
            "init": function (ele, params) {
                var inputOptions = $.extend({}, {
                    checked: false,
                    onLabel: '是',
                    offLabel: '否'
                }, params);
                ele.jqxSwitchButton(inputOptions);
                _triggerFormChange(ele, 'change');
            },
            "setValue": function (ele, name, val, root) {
                ele.jqxSwitchButton({
                    checked: val[name] * 1
                });
            },
            "getValue": function (ele, formData) {
                var itemVal = (ele.val() ? 1 : 0);
                formData[ele.data('name') + "_DISPLAY"] = (itemVal ? "是" : "否");
                return itemVal;
            },
            "disable": function (ele) {
                ele.jqxSwitchButton('disable');
            },
            "enable": function (ele) {
                ele.jqxSwitchButton('enable');
            }
        },

        "uploadfile": {
            "init": _initFileUpload,
            "setValue": function (ele, name, val, root) {
                var opt = $.extend({}, ele.data('defaultoptions'), {
                    contextPath: root,
                    token: val[name]
                });
                if (ele.data('disabled') == true || ele.data('disabled') == 'true') {
                    ele.emapFileDownload('destroy');
                    ele.emapFileDownload(opt);
                    return;
                }
                ele.emapFileUpload('destroy');
                ele.emapFileUpload(opt);
            },
            "getValue": function (ele, formData) {
                if (ele.data('disabled') == true || ele.data('disabled') == 'true') {
                    return ele.emapFileDownload('getValue');
                }
                return ele.emapFileUpload('getFileToken');
            },
            "disable": _disabledFileUpload,
            "enable": _enableFileUpload
        },

        "uploadphoto": {
            "init": _initFileUpload,
            "setValue": function (ele, name, val, root) {
                ele.emapFilePhoto('destroy');
                ele.emapFilePhoto($.extend({}, ele.data('defaultoptions'), {
                    contextPath: root,
                    token: val[name]
                }));
            },
            "getValue": function (ele, formData) {
                return ele.emapFilePhoto('getFileToken');
            },
            "disable": _disabledFileUpload,
            "enable": _enableFileUpload
        },
        "uploadsingleimage": {
            "init": _initFileUpload,
            "setValue": function (ele, name, val, root) {
                var opt = $.extend({}, ele.data('defaultoptions'), {
                    contextPath: root,
                    token: val[name]
                });
                if (ele.data('disabled') == true || ele.data('disabled') == 'true') {
                    ele.emapFileDownload('destroy');
                    opt.model = 'image';
                    ele.emapFileDownload(opt);
                    return;
                }
                ele.emapSingleImageUpload('destroy');
                ele.emapSingleImageUpload(opt);

            },
            "getValue": function (ele, formData) {
                if (ele.data('disabled') == true || ele.data('disabled') == 'true') {
                    return ele.emapFileDownload('getValue');
                }
                return ele.emapSingleImageUpload('getFileToken');
            },
            "disable": _disabledFileUpload,
            "enable": _enableFileUpload
        },
        "uploadmuiltimage": {
            "init": _initFileUpload,
            "setValue": function (ele, name, val, root) {
                var opt = $.extend({}, ele.data('defaultoptions'), {
                    contextPath: root,
                    token: val[name]
                })
                if (ele.data('disabled') == true || ele.data('disabled') == 'true') {
                    ele.emapFileDownload('destroy');
                    opt.model = 'image';
                    ele.emapFileDownload(opt);
                    return;
                }
                ele.emapImageUpload('destroy');
                ele.emapImageUpload(opt);
            },
            "getValue": function (ele, formData) {
                return ele.emapImageUpload('getFileToken');
            },
            "disable": _disabledFileUpload,
            "enable": _enableFileUpload
        },

        "buttonlist": {
            "init": _initButtonList,
            "setValue": function (ele, name, val, root) {
                $('.bh-label-radio.bh-active', ele).removeClass('bh-active');
                if (val[name] === undefined || val[name] === null || val[name] === '') {
                    var allBtn = $('.bh-label-radio[data-id=ALL]', ele);
                    if (allBtn.length > 0) {
                        allBtn.addClass('bh-active');
                    }
                } else {
                    var selectBtn = $('.bh-label-radio[data-id="' + val[name] + '"]', ele);
                    if (selectBtn.length > 0) {
                        selectBtn.addClass('bh-active');
                    }
                }
            },
            "getValue": function (ele, formData) {
                var selectedItems = $('.bh-label-radio.bh-active', ele);
                if (selectedItems.length) {
                    formData[ele.data('name') + "_DISPLAY"] = selectedItems.map(function (i, item) {
                        return $(item).data('name');
                    }).get().join(',');
                }
                return ele.bhButtonGroup('getValue');
            },
            "disable": _defaultDisabled,
            "enable": _defaultEnable
        },
        "multi-buttonlist": {
            "init": _initButtonList,
            "setValue": function () {
                // TODO
            },
            "getValue": function (ele, formData) {
                var selectedItems = $('.bh-label-radio.bh-active', ele);
                if (selectedItems.length) {
                    formData[ele.data('name') + "_DISPLAY"] = selectedItems.map(function (item) {
                        return $(item).data('name');
                    }).join(',');
                }
                return ele.bhButtonGroup('getValue');
            },
            "disable": _defaultDisabled,
            "enable": _defaultEnable
        },

        "div": {
            "init": function (ele, params, options) {},
            "setValue": function () {},
            "getValue": function (ele, formData) {
                return ele.val();
            },
            "disable": _defaultDisabled,
            "enable": _defaultEnable
        },

        "textarea": {
            "init": function (ele, params, options) {
                var inputOptions = $.extend({}, {
                    checkSize: ele.data('checksize'),
                    dataSize: ele.data('size'),
                    name: ele.data('name'),
                    textareaEasyCheck: options.textareaEasyCheck
                }, params);
                if (!options || options.textareaEasyCheck) {
                    inputOptions.limit = ele.data('checksize') ? ele.data('checksize') : parseInt(ele.data('size') / 3);
                } else {
                    inputOptions.limit = ele.data('checksize') ? ele.data('checksize') : ele.data('size');
                }
                ele.bhTxtInput(inputOptions);
                _triggerFormChange(ele, 'change');
            },
            "setValue": function (ele, name, val, root) {
                ele.bhTxtInput('setValue', (val[name] !== null && val[name] !== undefined) ? val[name] : "");
            },
            "getValue": function (ele, formData) {
                return ele.bhTxtInput('getValue');
            },
            "disable": function (ele) {
                ele.bhTxtInput('disabled', true);
            },
            "enable": function (ele) {
                ele.bhTxtInput('disabled', false);
            }
        },

        "static": {
            "init": function () {},
            "setValue": function (ele, name, val, root) {
                if (val[name + "_DISPLAY"] !== undefined) {
                    ele.text(val[name + "_DISPLAY"])
                    ele.data('valuedisplay', val[name + '_DISPLAY'])
                } else {
                    ele.text(val[name])
                }
                ele.data('value', val[name]);
            },
            "getValue": function (ele, formData) {
                if (ele.data('valuedisplay') !== undefined) {
                    formData[ele.data('name') + "_DISPLAY"] = ele.data('valuedisplay')
                }
                return ele.data('value');
            },
            "disable": function (ele, formData) {
                if (ele.data('valuedisplay') !== undefined) {
                    formData[ele.data('name') + "_DISPLAY"] = ele.data('valuedisplay')
                }
                return ele.data('value');
            },
            "disable": _defaultDisabled,
            "enable": _defaultEnable
        },

        "number": {
            "init": function (ele, params) {
                var inputOptions = $.extend({}, {
                    inputMode: 'simple',
                    spinButtons: true,
                    decimal: null,
                    decimalDigits: 0,
                    promptChar: ''
                }, params);
                ele.jqxNumberInput(inputOptions);
                _triggerFormChange(ele, 'change');
            },
            "setValue": function (ele, name, val, root) {
                var value = '';
                if ($.isPlainObject(val)) {
                    value = (val[name] !== null && val[name] !== undefined) ? val[name] : "";
                } else {
                    value = val;
                }
                if (value === '') {
                    ele.val(null);
                } else {
                    _setTextValue(ele, name, val, root);
                }
            },
            "getValue": function (ele, formData) {
                return ele.val() || ele.find('input').val();
            },
            "disable": function (ele) {
                ele.jqxNumberInput({
                    disabled: true
                });
            },
            "enable": function (ele) {
                ele.jqxNumberInput({
                    disabled: false
                });
            }
        },

        "number-range": {
            "init": function (ele, params) {
                ele.bhNumRange(params);
            },
            "setValue": function (ele, name, val, root) {
                if (val[name] === undefined || val[name] === null || val[name] === '') {
                    ele.bhNumRange('setValue', {
                        input1: null,
                        input2: null
                    });
                } else {
                    var valArr = val[name].toString().split(',');
                    if (valArr.length == 1) valArr[1] = valArr[0];
                    ele.bhNumRange('setValue', {
                        input1: valArr[0],
                        input2: valArr[1]
                    });
                }
            },
            "getValue": function (ele, formData) {
                return ele.bhNumRange('getValue');
            },
            "disable": function (ele) {
                ele.bhNumRange('disabled', true);
            },
            "enable": function (ele) {
                ele.bhNumRange('disabled', false);
            }
        },

        "text": {
            "init": function (ele, params) {
                ele.jqxInput({
                    width: '100%'
                });
                _triggerFormChange(ele, 'change');
            },
            "setValue": _setTextValue,
            "getValue": function (ele, formData) {
                var value = ele.val();
                var dataType = ele.data('type');
                if (value === '') return '';
                if (dataType) {
                    if ($.inArray(dataType.toLowerCase(), ['number', 'int', 'integer']) > -1) {
                        value = value * 1;
                        if (!isNaN(value)) {
                            return value;
                        }
                    }
                }
                return ele.val();
            },
            "disable": _defaultDisabled,
            "enable": _defaultEnable
        }

    };

    function _initSelect(ele, params, options) {
        var _this = $(ele);
        var xtype = _this.attr('xtype');
        var placeholder_option = {
            id: '',
            name: '请选择...',
            uid: ''
        };
        var blank_option = {
            id: '@__blank__value',
            name: '[空]',
            uid: ''
        };
        var source = [placeholder_option];
        var inputOptions = $.extend({}, {
            placeHolder: ele.attr('data-placeholder') || '请选择...',
            source: source,
            displayMember: "name",
            valueMember: "id",
            itemHeight: 28,
            enableBrowserBoundsDetection: true,
            filterable: true,
            width: "100%",
            filterPlaceHolder: "请查找",
            searchMode: 'containsignorecase',
            disabled: _this.data('disabled') ? true : false
        }, params);

        if (WIS_EMAP_CONFIG.dropDownOneKeySelect) {
            inputOptions.oneKeySelect = WIS_EMAP_CONFIG.dropDownOneKeySelect;
        }
        try {
            delete inputOptions.formatData;
        } catch (e) {}

        var changeEvent = 'change';

        if (xtype === 'multi-select2') {
            inputOptions.source = [];
            inputOptions.checkboxes = true;
            changeEvent = 'close';
        }
        // 高级搜索匹配空值@__blank__value 
        if (options && options.showBlankOption) {
            source.push(blank_option);
        }
        _triggerFormChange(_this, changeEvent);
        if (_this.data('optiondata')) {
            var option_data = _this.data('optiondata');
            if (typeof option_data == 'string') {
                try {
                    option_data = JSON.parse(option_data);
                } catch (e) {
                    console && console.error(_this.data('name') + 'optionData 格式错误, 必须是json格式');
                }
            } else {
                option_data = WIS_EMAP_SERV.cloneObj(option_data)
            }
            if (inputOptions.checkboxes !== true) {
                option_data.splice(0, 0, placeholder_option);
            }
            _this.jqxDropDownList(inputOptions);
            _this.jqxDropDownList({
                source: option_data
            });
            return;
        }

        _this.jqxDropDownList(inputOptions).on('open', function (e) {
            var _this = $(this);

            var $filterInput = _this.jqxDropDownList('listBoxContainer').jqxListBox('filter');
            $filterInput.css('position', 'relative');
            if (!$filterInput.find('[role="bh-placeholder-wrap"]').length) {
                WIS_EMAP_INPUT.placeHolder($filterInput);
            }

            if (!_this.data('loaded')) {
                _this.data('loaded', false);
                e.stopPropagation();
                var curVal = _this.val().split(',');
                //2016-5-6 qiyu 增加下拉后，仍然能选中值; 提出人：吴涛
                var curSelectIndex = [];

                //qiyu 2016-11-19 将获取mock的url提取函数，在mock文件中重新定义
                var source = {
                    url: _this.data("url"),
                    datatype: "json",
                    async: false,
                    type: WIS_EMAP_CONFIG.getOptionType,
                    root: "datas>code>rows",
                    formatData: function (data) {
                        if (_this.data('jsonparam')) {
                            var jParam = {};
                            if (typeof _this.data('jsonparam') === 'string') {
                                try {
                                    jParam = JSON.parse(_this.data('jsonparam').replace(/\'/g, '"'))
                                } catch (e) {
                                    console && console.warn('无效的JSONParam参数！');
                                }
                            } else if (typeof _this.data('jsonparam') === 'object') {
                                jParam = _this.data('jsonparam');
                            }

                            // 处理从JSONParam中传入的formatData， 由于emap配置中JSONParam只能传字符串，所以目前此场景只会在公有云环境中使用
                            // if (jParam.formatData && typeof jParam.formatData == 'function') {
                            //     data = jParam.formatData(data);
                            // }
                        }
                        // 处理从defaultOptions中传入的formatData
                        if (params.formatData) {
                            data = params.formatData(data);
                        }
                        return data;
                    }
                };
                if (typeof window.MOCK_CONFIG != 'undefined') {
                    source = getSourceMock(source);
                }
                var selectDataAdapter = new $.jqx.dataAdapter(source, {
                    beforeLoadComplete: function (records) {
                        if (options && options.showBlankOption) {
                            records.unshift(blank_option);
                        }
                        if (xtype === 'select') {
                            records.unshift(placeholder_option);
                        }
                        //2016-5-6 qiyu 增加下拉后，仍然能选中值; 提出人：吴涛
                        for (var i = 0; i < records.length; i++) {
                            //qiyu 2017-2-23 放置XSS攻击处理
                            records[i].name = BH_UTILS.fxss(records[i].name);
                            if ($.inArray(records[i].id, curVal) > -1 && records[i].id !== "") { // 避免将空值放入数组 zhuhui 0815
                                curSelectIndex.push(i);
                            }
                        }
                    },
                    loadComplete: function (data) {
                        var selectMethod = xtype == 'select' ? 'selectIndex' : 'checkIndex';
                        //2016-5-6 qiyu 增加下拉后，仍然能选中值; 提出人：吴涛
                        if (curSelectIndex.length > 0) {
                            $(curSelectIndex).each(function () {
                                _this.jqxDropDownList(selectMethod, this);
                            });
                        } else {
                            _this.jqxDropDownList(selectMethod, -1);
                        }
                        setTimeout(function () {
                            _this.data('loaded', true);
                        }, 1);
                    }
                });
                _this.jqxDropDownList({
                    source: selectDataAdapter
                });
                //2016-3-31 qiyu，重复加载数据了
                //selectDataAdapter.dataBind();
            }
        });

        // 下拉框收起时，将下拉框的搜索框中内容清空， 否则会对select取值造成影响
        _this.on('close', function () {
            var items = $(this).jqxDropDownList('getItems');
            if (items && items.length > 0) {
                // 通过items 找到 下拉框dom对象
                var dropdown_dom = $(items[0].element).closest('.jqx-listbox');
                if (dropdown_dom.length) {
                    $('.jqx-listbox-filter-input', dropdown_dom).val('').trigger('keyup');
                }
            }
        });

        // 高级搜索中，下拉多选的空值联动， 当选中空值项时，将其他项取消勾选
        var flag = false;
        if (options && options.showBlankOption && xtype === 'multi-select2') {
            _this.on('checkChange', function (e) {
                var args = e.args;
                if (!args || flag) return;
                flag = true;
                // 勾选空值时，将其他选项取消勾选
                if (args.value === '@__blank__value' && args.checked === true) {
                    _this.jqxDropDownList('uncheckAll');
                    _this.jqxDropDownList('checkItem', args.item);
                } else if (args.value !== '@__blank__value') { // 勾选其他值时，将空值项取消勾选
                    var checked_items = _this.jqxDropDownList('getCheckedItems');
                    if (checked_items && checked_items.length > 0) {
                        var blank_item = checked_items.filter(function (item) {
                            return item.value === '@__blank__value';
                        });
                        if (blank_item.length > 0) { //空值选项在勾选时
                            _this.jqxDropDownList('uncheckItem', blank_item[0]);
                        }
                    }
                    console.log(_this.jqxDropDownList('getCheckedItems'))
                }
                flag = false;
            })
        }
    }

    function _initDateInput(ele, params) {
        var _this = ele;
        var xtype = _this.attr('xtype');
        var inputOptions = $.extend({}, {
            width: "100%",
            disabled: _this.data('disabled'),
            value: null,
            formatString: 'yyyy-MM',
            culture: 'zh-CN',
            showFooter: true,
            clearString: '清除',
            enableBrowserBoundsDetection: true,
            todayString: '今天'
        }, params);
        if (xtype == 'date-local') {
            inputOptions.formatString = 'yyyy-MM-dd';
        } else if (xtype == 'date-full') {
            inputOptions.formatString = _this.data('format') ? _this.data('format') : 'yyyy-MM-dd HH:mm';
            inputOptions.showTimeButton = true;
        }
        inputOptions.formatString = _this.data('format') || inputOptions.formatString;
        _this.jqxDateTimeInput(inputOptions);
        // 不为date-full时， 点击文本框也会弹出下拉
        // 为date-full 时， 则不做处理，因为可能会出现 HH : mm 的情况
        if (xtype != 'date-full') {
            _this.on("click", function (e) {
                e.stopPropagation();
                var disabled = $(this).jqxDateTimeInput('disabled');
                if (!disabled) $(this).jqxDateTimeInput('open');

            });

            // 清除输入的 非数字
            _this.on('input', function () {
                if (isNaN(parseInt(_this.val()))) {
                    _this.val('');
                }
            });
        }
        _triggerFormChange(_this, 'change');
    }

    function _initTree(ele, params, options) {
        var xtype = ele.attr('xtype');
        var inputOptions = $.extend({}, {
            url: ele.data('url'),
            checkboxes: false,
            search: true,
            placeholder: ele.attr('data-placeholder') || '请选择...',
            showBlankOption: options.showBlankOption,
            treeParams: {}
        }, params);
        if (xtype === 'multi-tree') {
            inputOptions.checkboxes = true;
        }
        if (params.hasThreeStates !== undefined) {
            // 无法与现有下拉树异步加载兼容
            // inputOptions.treeParams.hasThreeStates = params.hasThreeStates;
        }
        ele.emapDropdownTree(inputOptions);
        if (ele.data('disabled')) {
            ele.emapDropdownTree('disable');
            var formGroup = ele.closest('.bh-form-group');
            if (formGroup.length > 0) {
                formGroup.addClass('disabled');
            }
        }
        var changeEvent = 'change';
        if (xtype == 'multi-tree') {
            changeEvent = 'close';
        }
        _triggerFormChange(ele, changeEvent);
    }

    function _initFileUpload(ele, params, options) {
        var _this = ele;
        var xtype = _this.attr('xtype');
        var readonly = (_this.data('disabled') == 'true' || _this.data('disabled') == true || options.readonly);
        var inputOptions = $.extend({}, {
            contextPath: options.root
        }, params);
        _this.data('defaultoptions', inputOptions);
        if (xtype == 'uploadfile') {
            if (readonly) {
                _this.emapFileDownload(inputOptions);
                return;
            }
            _this.emapFileUpload(inputOptions);
        } else if (xtype == 'uploadphoto') {
            _this.emapFilePhoto(inputOptions);
        } else if (xtype == 'uploadsingleimage') {
            _this.emapSingleImageUpload(inputOptions);
        } else if (xtype == 'uploadmuiltimage') {
            _this.emapImageUpload(inputOptions);
        }
        if (_this.data('disabled') == true) {
            $('input[type=file]', _this).attr('disabled', true);
        }
        _this.on('bh.file.upload.done', function () {
            _this.trigger('_formChange');
        });
    }

    function _initButtonList(ele, params) {
        var xtype = ele.attr('xtype');
        var inputOptions = $.extend({}, {
            url: ele.data('url'),
            allOption: ele.data('alloption')
        }, params);
        if (xtype == 'multi-buttonlist') {
            inputOptions.multiple = true;
            inputOptions.allOption = false;
        }
        ele.bhButtonGroup(inputOptions);
        _triggerFormChange(ele, 'change');
    }

    function _setSelectValue(ele, val) {
        if (typeof val == "object") {
            ele.jqxDropDownList('addItem', val[0])
            ele.jqxDropDownList('checkAll');
        } else {
            //qiyu 2016-1-2 判断为空时，清空所有选项
            if (val === "" || val === undefined) {
                ele.jqxDropDownList('clearSelection');
            } else {
                ele.val(val);
            }
        }
    }

    function _setTextValue(ele, name, val, root) {
        ele.val((val[name] !== null && val[name] !== undefined) ? val[name] : "");
    }

    function _triggerFormChange(ele, eventName) {
        ele.on(eventName, function () {
            ele.trigger('_formChange');
        });
    }

    function _disabledFileUpload(ele) {
        $('input[type=file]', ele).attr('disabled', true);
        var editBar = $('.bh-file-img-single-edit', ele);
        if (editBar.length > 0) {
            editBar.hide();
        }
        var infoP = $('.bh-file-img-info', ele);
        if (infoP.length > 0) {
            infoP.hide();
        }
    }

    function _enableFileUpload(ele) {
        $('input[type=file]', ele).attr('disabled', false);
        var editBar = $('.bh-file-img-single-edit', ele);
        if (editBar.length > 0) {
            $('.bh-file-img-single-edit', ele).show();
        }
        var infoP = $('.bh-file-img-info', ele);
        if (infoP.length > 0) {
            infoP.show();
        }
    }

    function _defaultDisabled(ele) {
        ele.attr('disabled', true);
    }

    function _defaultEnable(ele) {
        ele.attr('disabled', false);
    }