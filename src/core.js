(function (WIS_EMAP_INPUT, undefined) {
    /**
     * @module WIS_EMAP_INPUT
     * @alias 表单控件公共方法
     * @description WIS_EMAP_INPUT是一个封装了常用表单组件方法的全局对象，表单控件是以标签上的xtype属性作为控件类型的标识符，
     * 所有带有xtype属性的标签都认为是一个表单控件，以data-name属性为字段name 的标识符
     * @example
     WIS_EMAP_INPUT.init($form, {root: '/emap'})
     */


    /**
     * @method init
     * @description 表单控件初始化
     * @param {Object} element - 要实例化的控件占位DOM, 可以是单个控件占位或者表单外框
     * @param {Object=} opt - 表单控件options 对象
     * @example 
     * WIS_EMAP_INPUT.init($container, {}); 
     */
    WIS_EMAP_INPUT.init = function (element, opt) {
        //控件初始化
        opt = opt || {};
        var options = $.extend({}, {
            'root': ''
        }, opt);

        if ($(element).attr('xtype')) {
            if ($(element).hasClass('bh-form-static') || $(element).attr('data-disabled') === true || $(element).attr('data-disabled') === 'true') {
                var readonly = WIS_EMAP_INPUT.component[$(element).attr('xtype')].readonly
                if (readonly) {
                    inputInit(element, options, 'readonly');
                }
                return;
            } // 静态展示字段不做实例化
            inputInit(element, options);
        } else {
            opt._inputInitCount = 0;
            opt._inputInitCounter = 0;
            $(element).find('[xtype]').each(function () {
                if ($(this).hasClass('bh-form-static') || $(this).attr('data-disabled') === true || $(this).attr('data-disabled') === 'true') {
                    if (WIS_EMAP_INPUT.component[$(this).attr('xtype')]['readonly']) {
                        inputInit(this, options, 'readonly');
                    } else {
                        return true;
                    }
                } else {
                    if (this.nodeName == 'TEXTAREA' && this.hasAttribute('readOnly')) {
                        return;
                    }
                    if ($.inArray($(this).attr('xtype'), ['checkboxlist', 'radiolist', 'buttonlist', 'multi-buttonlist', 'uploadfile', 'uploadsingleimage', 'uploadmuiltimage']) > -1) {
                        opt._inputInitCount++;
                    }
                    inputInit(this, options);
                }
            });
            $(element).on('bhInputInitComplete', function () {
                opt._inputInitCounter++;
                if (opt._inputInitCounter == opt._inputInitCount) {
                    $(this).trigger('_init');
                }
            });
        }

        function inputInit(ele, options, method) {
            var _this = $(ele);
            var jsonParam = _this.data('jsonparam');
            var metd = method || 'init';
            if (typeof jsonParam == 'string') {
                try {
                    jsonParam = JSON.parse(jsonParam.replace(/'/g, '"'));
                } catch (e) {
                    console && console.warn('无效的json param格式!');
                    jsonParam = {};
                }
            }

            var inputParam = options.defaultOptions ? (options.defaultOptions[_this.attr('xtype')] || {}) : {};
            // 对 itemOptions 的处理
            if (options.itemOptions && options.itemOptions[_this.data('name')]) {
                $.extend(inputParam, options.itemOptions[_this.data('name')]);
            }
            var params = $.extend({}, inputParam, jsonParam);
            var xtype = _this.attr('xtype') || 'text';
            if (!WIS_EMAP_INPUT.component[xtype]) {
                return console && console.error(xtype + '控件类型未定义！');
            }
            WIS_EMAP_INPUT.component[xtype][metd](_this, params, options);
        }
    };

    /**
     * @method setValue
     * @description 表单控件赋值
     * @param {Object} element - 需要初始化的控件DOM
     * @param {String} name - 字段的name
     * @param {String} xtype - 控件类型
     * @param {Object} val - 数据对象 如 {WID: 123}
     * @param {String} root - emap跟路径, 上传控件时必传
     * @example 
     * WIS_EMAP_INPUT.setValue($itemElement, 'WID', 'text', {WID: '123456', ''}) 
     */
    WIS_EMAP_INPUT.setValue = function (element, name, xtype, val, root) {
        var _this = $(element);
        if (!name) {
            name = _this.data('name');
        }

        if (xtype == "undefined") xtype = "text";
        xtype = xtype || 'text';
        WIS_EMAP_INPUT.component[xtype].setValue(element, name, val, root);
    };

    /**
     * @method formSetValue
     * @description 表单赋值
     * @param {Object} element - 表单容器
     * @param {Object} val - 数据对象  如 {WID: 123}
     * @param {Object} options - 表单的options对象
     * @example 
     * WIS_EMAP_INPUT.formSetValue($container, {
     *      'WID': '123456',
     *      'XB': '1',
     *      'XB_DISPLAY': '男'
     * }) 
     */
    WIS_EMAP_INPUT.formSetValue = function (element, val, options) {
        var $element = $(element);
        if (options && options.readonly) {
            // 只读表单
            options.formValue = val;
            $element.find('[xtype]').each(function () {
                var name = $(this).data('name');
                var _this = $(this);
                var nameDisplay = null;
                if (val[name] !== undefined && val[name] !== null) {
                    switch ($(this).attr('xtype')) {
                        case 'multi-select':
                        case 'select':
                        case 'multi-select2':
                            if (val[name + '_DISPLAY']) {
                                setItemVal(val[name + '_DISPLAY'], val[name]);
                            } else {
                                var valueArr = val[name].split(',');
                                var nameArr = [];
                                if (_this.data('attr') && _this.data('attr').optionData) {
                                    var option_data = _this.data('attr').optionData;
                                    if (option_data) {
                                        if (typeof option_data === 'string') {
                                            try {
                                                option_data = JSON.parse(option_data);
                                            } catch (e) {
                                                conosle && console.error('非法的 optionData json 格式！！')
                                            }
                                        }
                                        $(option_data).each(function () {
                                            if ($.inArray(this.id, valueArr) > -1) {
                                                nameArr.push(this.name);
                                            }
                                        });
                                        setItemVal(nameArr.join(','), val[name]);
                                    } else {
                                        option_data = WIS_EMAP_SERV.cloneObj(option_data)
                                    }
                                } else {
                                    if (!_this.data("url")) return console && console.error('缺少url配置');
                                    WIS_EMAP_INPUT.getInputOptions(_this.data("url"), function (res) {
                                        _this.data('model', res);

                                        $(res).each(function () {
                                            if ($.inArray(this.id, valueArr) > -1) {
                                                nameArr.push(this.name);
                                            }
                                        });
                                        setItemVal(nameArr.join(','), val[name]);
                                    });
                                }
                            }
                            break;
                        case 'radiolist':
                            if (val[name + '_DISPLAY']) {
                                setItemVal(val[name + '_DISPLAY'], val[name]);
                            } else {
                                WIS_EMAP_INPUT.getInputOptions(_this.data("url"), function (res) {
                                    _this.data('model', res);
                                    $(res).each(function () {
                                        if (this.id == val[name]) {
                                            nameDisplay = this.name;
                                            return false;
                                        }
                                    });
                                });
                            }
                            break;

                        case 'checkboxlist':
                            if (val[name + '_DISPLAY']) {
                                setItemVal(val[name + '_DISPLAY'], val[name]);
                            } else {
                                WIS_EMAP_INPUT.getInputOptions(_this.data("url"), function (res) {
                                    _this.data('model', res);
                                    var valueArr = val[name].split(',');
                                    var nameArr = [];
                                    $(res).each(function () {
                                        if ($.inArray(this.id, valueArr) > -1) {
                                            nameArr.push(this.name);
                                        }
                                    });
                                    setItemVal(nameArr.join(','), val[name]);
                                });
                            }

                            break;
                        case 'tree':
                            if (val[name + '_DISPLAY']) {
                                setItemVal(val[name + '_DISPLAY'], val[name]);
                            } else {
                                WIS_EMAP_INPUT.getInputOptions(_this.data("url"), function (res) {
                                    _this.data('model', res);
                                    var valueArr = val[name].split(',');
                                    var nameArr = [];
                                    $(res).each(function () {
                                        if ($.inArray(this.id, valueArr) > -1) {
                                            nameArr.push(this.name);
                                        }
                                    });
                                    setItemVal(nameArr.join(','), val[name]);
                                });
                            }
                            break;
                        case 'uploadfile':
                            $(this).emapFileDownload('destroy');
                            $(this).emapFileDownload($.extend({}, {
                                contextPath: options.root,
                                token: val[name],
                            }, JSON.parse(
                                decodeURI($(this).data('jsonparam')).replace(/"/g, '').replace(/'/g, '"')
                            )));
                            break;
                        case 'uploadsingleimage':
                        case 'uploadmuiltimage':
                            $(this).emapFileDownload('destroy');
                            $(this).emapFileDownload($.extend({}, {
                                model: 'image',
                                contextPath: options.root,
                                token: val[name]
                            }, JSON.parse(
                                decodeURI($(this).data('jsonparam')).replace(/"/g, '').replace(/'/g, '"')
                            )));
                            break;
                        case 'uploadphoto':
                            $(this).emapFilePhoto('destroy');
                            $(this).emapFilePhoto($.extend({}, {
                                token: val[name],
                                contextPath: options.root
                            }, JSON.parse(
                                decodeURI($(this).data('jsonparam')).replace(/"/g, '').replace(/'/g, '"')
                            )));
                            $('a', this).hide();
                            break;
                        case 'cache-upload':
                            $(this).cacheUpload('destroy');
                            $(this).cacheUpload($.extend({}, {
                                token: val[name],
                                readonly: true,
                            }, JSON.parse(
                                decodeURI($(this).data('jsonparam')).replace(/"/g, '').replace(/'/g, '"')
                            )));
                            break;
                        case 'switcher':
                            val[name + 'DISPLAY'] = parseInt(val[name]) ? '是' : '否';
                            setItemVal(val[name + 'DISPLAY'], val[name]);
                            break;
                        default:
                            setItemVal(val[name], _this.data('attr'));
                    }
                }

                function setItemVal(val_dis, val, attr) {
                    if (val_dis != null) {
                        _this.text(val_dis).attr('title', val_dis).data('value', val);
                    } else if (attr) {
                        var option_data = attr.optionData;
                        var valueArr = val.split(',');
                        var nameArr = [];
                        if (option_data) {
                            if (typeof option_data === 'string') {
                                try {
                                    option_data = JSON.parse(option_data);
                                } catch (e) {
                                    return console && console.error('无效的optionData json 格式！！');
                                }
                            } else {
                                option_data = WIS_EMAP_SERV.cloneObj(option_data);
                            }

                            $(option_data).each(function () {
                                if ($.inArray(this.id, valueArr) > -1) {
                                    nameArr.push(this.name);
                                }
                            });
                            var renderMethod = WIS_EMAP_CONFIG.xssSafeRender ? 'text' : 'html';
                            _this[renderMethod](nameArr.join(',')).attr('title', nameArr.join(',')).data('value', val[name]);
                        }
                    }
                }
            });
        } else {

            // 编辑表单
            $element.find('[xtype]').each(function () {
                var name = $(this).data('name');
                var _this = $(this);
                var xtype = _this.attr('xtype');
                var renderMethod = WIS_EMAP_CONFIG.xssSafeRender ? 'text' : 'html';
                //qiyu 2016-1-2 清空表单时，传入字段值为空，需要重置该控件
                //qiyu 2016-3-17 清空表单请使用clear方法，以下这句话将被注释掉
                //if (val[name] == null) {val[name] = ""}

                // 为表格表单中的 只读字段赋值 & 只读的textarea赋值
                // if (options && options.model == 't') {
                if (_this.hasClass('bh-form-static') || _this.attr('xtype') == 'static') {
                    if (val[name] != null) {
                        if (val[name + '_DISPLAY'] !== undefined && val[name + '_DISPLAY'] !== null) {

                            _this[renderMethod](val[name + '_DISPLAY']).attr('title', val[name + '_DISPLAY']).data('value', val[name]);
                        } else {
                            if (_this.data('attr') && _this.data('attr').optionData) {
                                var option_data = _this.data('attr').optionData;
                                var valueArr = val[name].toString().split(',');
                                var nameArr = [];
                                if (option_data) {
                                    if (typeof option_data === 'string') {
                                        try {
                                            option_data = JSON.parse(option_data);
                                        } catch (e) {
                                            return console && console.error('无效的optionData json 格式！！');
                                        }
                                    } else {
                                        option_data = WIS_EMAP_SERV.cloneObj(option_data);
                                    }
                                    $(option_data).each(function () {
                                        if ($.inArray(this.id + '', valueArr) > -1) {
                                            nameArr.push(this.name);
                                        }
                                    });
                                    _this[renderMethod](nameArr.join(',')).attr('title', nameArr.join(',')).data('value', val[name]);
                                }
                            } else {
                                _this[renderMethod](val[name]).attr('title', val[name]).data('value', val[name]);
                            }
                        }
                    }
                    return;
                } else if (_this.attr('xtype') == 'textarea' && _this.attr('readonly')) {
                    if (val[name] != null) {
                        _this.val(val[name]);
                    }
                    return;
                }

                // }


                if (val === undefined) {

                } else if (val[name] !== undefined && val[name] !== null) {
                    WIS_EMAP_INPUT.setValue(_this, name, xtype, val, options.root || "");
                }
            });
        }
    };

    /**
     * @method getInputOptions
     * @description 获取表单选项数据
     * @param {String} url - 请求地址
     * @param {function} callback - 请求成功的回调函数
     * @description 
     * WIS_EMAP_INPUT.getInputOptions($item.data('url'), function (res) {
     *      $item.jqxDropdownList({source: res});
     * }) 
     */
    WIS_EMAP_INPUT.getInputOptions = function (url, callback) {
        // var dataAdapter = new $.jqx.dataAdapter({
        //     url: url,
        //     datatype: "json",
        //     //async: false,
        //     root: "datas>code>rows"
        // }, {
        //     loadComplete: function(records) {
        //         callback(records.datas.code.rows);
        //     }
        // });

        //qiyu 2016-11-19 将获取mock的url提取函数，在mock文件中重新定义
        var source = {
            url: url,
            datatype: "json",
            //async: false,
            root: "datas>code>rows"
        }
        if (typeof window.MOCK_CONFIG != 'undefined') {
            source = getSourceMock(source);
        }
        var dataAdapter = new $.jqx.dataAdapter(source, {
            loadComplete: function (records) {
                callback(records.datas.code.rows);
            }
        });

        dataAdapter.dataBind();
    };

    /**
     * @method formClear
     * @description 表单附件清空,如果不传参数val，则清空表单中所有值; 如果传入参数是个数组，则清空该数组中为字段名称的控件值
     * @param {Object} element - 表单容器DOM
     * @param {String | Array} [val] - 需要清空的字段name,若不传则清空容器内所有的字段
     * @param {Object} [options] - 表单options参数
     * @example 
     * WIS_EMAP_INPUT.formClear($container, ['WID', 'XM', 'XH']) 
     */
    WIS_EMAP_INPUT.formClear = function (element, val, options) {
        var $element = $(element);
        options = options || {};
        if (options && options.readonly) { // clear只读表单
            if (val == undefined) {
                $element.find('[xtype]').each(function () {
                    $(this).html("");
                });
                options.formValue = {};

            } else {
                for (var i = 0; i < val.length; i++) {
                    $element.find('[data-name=' + val[i] + '][xtype]').html("");
                    options.formValue[val[i]] = "";
                }
            }
        } else {
            if (val === undefined) {
                $element.find('[xtype]').each(function () {
                    var name = $(this).data('name');
                    var xtype = $(this).attr('xtype');
                    var _this = $(this);
                    WIS_EMAP_INPUT.setValue(_this, name, xtype, "", options.root);
                });
            } else {
                for (var i = 0; i < val.length; i++) {
                    var name = val[i];
                    var _this = $element.find('[data-name=' + name + '][xtype]');
                    var xtype = _this.attr('xtype');
                    var blank_val = {};
                    blank_val[name] = "";
                    WIS_EMAP_INPUT.setValue(_this, name, xtype, blank_val, options.root);
                }
            }
        }
    };

    /**
     * @method formGetValue
     * @description 表单取值
     * @param {Object} element - 表单容器DOM
     * @param {Object} [options] - 表单options对象
     * @returns {Object} 表单数据JSON对象
     * @example
     * WIS_EMAP_INPUT.formGetValue($container); 
     */
    WIS_EMAP_INPUT.formGetValue = function (element, options) {
        var $element = $(element);
        var formData;
        if (options && options.readonly) {
            formData = options.formValue || {};
            options.data.map(function (item) {
                if (formData[item.name] === undefined) {
                    formData[item.name] = '';
                }
            });
            return formData;
        } else {
            formData = {};
            $element.find('[xtype]').each(function () {
                var itemVal = "";

                // 表格表单静态展示项
                if ($(this).hasClass('bh-form-static') || ($(this).attr('readOnly') && $(this).attr('xtype') === 'textarea')) {

                    if ($.inArray($(this).attr('xtype'), ['radiolist', 'checkboxlist', 'tree', 'multi-select', 'select']) > -1) {
                        formData[$(this).data('name') + "_DISPLAY"] = $(this).text();
                        itemVal = $(this).data('value');
                    } else {
                        itemVal = $(this).data('value');
                    }
                } else {
                    itemVal = WIS_EMAP_INPUT.component[$(this).attr('xtype')].getValue($(this), formData);
                }

                formData[$(this).data('name')] = itemVal;
            });
            return formData;
        }
    };

    /**
     * @method getValue
     * @description 表单项控件取值
     * @param {Object} ele - 表单项控件DOM
     * @param {Object} [formData] - 用于存放控件_DISPLAY 值的对象，若字段取值是字典，则将_DISPLAY值写到改对象上
     * @returns {Object} 表单数据JSON对象
     * @example
     * var formData = {};
     * WIS_EMAP_INPUT.getValue($item, formData); 
     */
    WIS_EMAP_INPUT.getValue = function (ele, formData) {
        if (!$(ele).length) return console && console.error('WIS_EMAP_INPUT.getValue 方法 ele参数不能为空');
        var xtype = $(ele).attr('xtype') || 'text';
        var itemVal = "";
        // 表格表单静态展示项
        if ($(ele).hasClass('bh-form-static') || ($(ele).attr('readOnly') && $(ele).attr('xtype') === 'textarea')) {

            if ($.inArray($(ele).attr('xtype'), ['radiolist', 'checkboxlist', 'tree', 'multi-select', 'select']) > -1) {
                formData[$(ele).data('name') + "_DISPLAY"] = $(ele).text();
                itemVal = $(ele).data('value');
            } else {
                itemVal = $(ele).data('value');
            }
        } else {
            itemVal = WIS_EMAP_INPUT.component[$(ele).attr('xtype')].getValue($(ele), formData);
        }
        return itemVal === undefined ? '' : itemVal;
    }

    /**
     * @method disable
     * @description 表单控件 disable
     * @param {Object} element - 控件DOM
     * @example
     * WIS_EMAP_INPUT.disable($('[data-name="WID"]'))
     */
    WIS_EMAP_INPUT.disable = function (element) {
        if (!element || $(element).length == 0) {
            console && console.warn('Can not find field ');
            return;
        }
        var item = $(element);
        WIS_EMAP_INPUT.component[item.attr('xtype')].disable(item);
        var formGroup = item.closest('.bh-form-group');
        if (formGroup.length) {
            formGroup.addClass('bh-disabled');
        }
    };

    /**
     * @method formDisable
     * @description 表单disable
     * @param {Object} element - 表单DOM
     * @param {String | Array} [names] - 需要disable的字段name, 若不传则禁用表单中所有字段
     * @example
     * WIS_EMAP_INPUT.formDisable($container, ['WID', 'XB']) 
     */
    WIS_EMAP_INPUT.formDisable = function (element, names) {
        if (!names) {
            // 禁用整个表单
            $('[xtype]', $(element)).each(function () {
                WIS_EMAP_INPUT.disable(this);
            });
        } else if (names instanceof Array) {
            // 多字段禁用
            names.map(function (item) {
                var inputElement = $('[data-name=' + item + ']', $(element));
                if (inputElement.length == 0) {
                    console && console.warn('Can not find field ' + item);
                    return;
                }
                WIS_EMAP_INPUT.disable(inputElement);
            });
        } else {
            // 单字段禁用
            var inputElements = $('[data-name=' + names + ']', $(element));
            if (inputElements.length == 0) {
                console && console.warn('Can not find field ' + names);
                return;
            }
            inputElements.each(function () {
                WIS_EMAP_INPUT.disable(this);
            });
        }
    };

    /**
     * @method enable
     * @description 表单控件enable
     * @param {Object} element - 控件DOM
     * @example 
     * WIS_EMAP_INPUT.enable($('[data-name="WID"]'))
     */
    WIS_EMAP_INPUT.enable = function (element) {
        if (!element || $(element).length == 0) {
            console && console.warn('Can not find field ');
            return;
        }
        var item = $(element);
        WIS_EMAP_INPUT.component[item.attr('xtype')].enable(item);
        var formGroup = item.closest('.bh-form-group');
        if (formGroup.length) {
            formGroup.removeClass('bh-disabled');
        }
    };

    /**
     * @method formEnable
     * @description 表单enable
     * @param {Object} element - 表单DOM
     * @param {String | Array} [names] - 需要enable的字段name, 若不传则启用表单中所有字段
     * @example 
     *  WIS_EMAP_INPUT.formEnable($container, ['WID', 'XB', 'NL'])
     */
    WIS_EMAP_INPUT.formEnable = function (element, names) {
        if (!names) {
            // 启用整个表单
            $('[xtype]', $(element)).each(function () {
                WIS_EMAP_INPUT.enable(this);
            });
        } else if (names instanceof Array) {
            // 多字段启用
            names.map(function (item) {
                var inputElement = $('[data-name=' + item + ']', $(element));
                if (inputElement.length == 0) {
                    console && console.warn('Can not find field ' + item);
                    return;
                }
                WIS_EMAP_INPUT.enable(inputElement);
            });
        } else {
            // 单字段启用 
            var inputElements = $('[data-name=' + names + ']', $(element));
            if (inputElements.length == 0) {
                console && console.warn('Can not find field ' + names);
                return;
            }
            inputElements.each(function () {
                WIS_EMAP_INPUT.enable(this);
            });
        }
    };

    /**
     * @method renderPlaceHolder   
     * @description 根据数据模型项渲染单个字段的placeholder
     * @param {Object} item - 字段数据模型
     * @param {String} type - 取值类型，可选值： 'form' 'search' 'grid';
     * @param {Object} [params] - 其他参数
     * @param {Boolean} [params.showPlaceholder=false] - 是否添加placeHolder
     * @returns {string}
     * @example 
     * WIS_EMAP_INPUT.renderPlaceHolder({
     *      xtype: 'text',
     *      name: 'WID',
     *      caption: '编号'
     * })
     */
    WIS_EMAP_INPUT.renderPlaceHolder = function (item, type, params) {
        var attr = WIS_EMAP_INPUT.getAttr(item, type);
        var pam = params || {};
        if (attr.inputReadonly && !WIS_EMAP_INPUT.component[attr.xtype]['readonly']) {
            if ($.inArray(attr.xtype, ['uploadfile', 'uploadsingleimage', 'uploadmuiltimage', 'cache-upload', 'direct-upload']) == -1) {
                attr.xtype = "static";
            }
        }
        var controlHtml = "";
        switch (attr.xtype) {
            case undefined:
            case "text":
                attr.xtype = "text";
                controlHtml = '<input class="bh-form-control" data-caption="{{caption}}" data-type="{{dataType}}" data-name="{{name}}" name="{{name}}" xtype="{{xtype}}" type="{{xtype}}" {{checkType}} {{JSONParam}}  {{dataSize}} {{checkSize}} {{checkExp}} ' + (attr.inputReadonly ? 'readOnly' : '') + ' ' + (pam.showPlaceholder ? 'placeholder="' + attr.placeholder + '"' : '') + ' />';
                break;
            case "textarea":
                controlHtml = '<div xtype="{{xtype}}" data-caption="{{caption}}" data-type="{{dataType}}" data-name="{{name}}" {{checkType}} {{dataSize}} {{checkSize}} {{checkExp}} {{JSONParam}} ' + (attr.inputReadonly ? 'readOnly' : '') + ' ></div>';
                break;
            case "radiolist":
                controlHtml = '<div xtype="{{xtype}}" data-caption="{{caption}}" data-type="{{dataType}}" class="bh-radio jqx-radio-group" data-name="{{name}}" {{url}} {{checkSize}} data-disabled={{inputReadonly}}></div>';
                break;
            case "checkboxlist":
                controlHtml = '<div xtype="{{xtype}}" data-caption="{{caption}}" data-type="{{dataType}}" class="bh-checkbox" data-name="{{name}}" {{checkType}} {{url}} {{checkSize}} data-disabled={{inputReadonly}}></div>';
                break;
            case "selecttable":
            case "select":
            case "multi-select2":
            case "tree":
            case "multi-tree":
            case "date-local":
            case "date-ym":
            case "date-full":
            case "date-range":
            case "date-area":
            case "switcher":
            case "uploadfile":
            case "uploadphoto":
            case "uploadsingleimage":
            case "uploadmuiltimage":
            case "buttonlist":
            case "multi-buttonlist":
            case "multi-select":
            case "div":
            case "static":
            case "number":
            case "number-range":
            default:
                controlHtml = '<div xtype="{{xtype}}" data-caption="{{caption}}" data-type="{{dataType}}" data-name="{{name}}" {{url}} {{format}} {{checkType}} {{JSONParam}} {{checkSize}} data-disabled={{inputReadonly}} ' +
                    (pam.showPlaceholder ? 'data-placeholder="' + attr.placeholder + '"' : '') +
                    '></div>';
                break;

        }
        controlHtml = controlHtml.replace(/\{\{xtype\}\}/g, attr.xtype)
            .replace(/\{\{name\}\}/g, attr.name)
            .replace(/\{\{dataType\}\}/g, attr.dataType)
            .replace(/\{\{inputReadonly\}\}/g, attr.inputReadonly)
            .replace(/\{\{caption\}\}/g, attr.caption);

        // 解决 $$ 在replace中被 转义为$ 的问题
        controlHtml = controlHtml.replace(/\{\{url\}\}/g, function () {
            return attr.url ? ('data-url="' + attr.url + '"') : '';
        });
        controlHtml = controlHtml.replace(/\{\{format\}\}/g, attr.format ? ('data-format="' + attr.format + '"') : '');
        controlHtml = controlHtml.replace(/\{\{checkType\}\}/g, attr.checkType ? ('data-checktype="' + encodeURI(attr.checkType) + '"') : '');
        controlHtml = controlHtml.replace(/\{\{dataSize\}\}/g, attr.dataSize ? ('data-size="' + attr.dataSize + '"') : '');
        controlHtml = controlHtml.replace(/\{\{checkSize\}\}/g, attr.checkSize ? ('data-checksize="' + attr.checkSize + '"') : '');
        controlHtml = controlHtml.replace(/\{\{checkExp\}\}/g, attr.checkExp ? ('data-checkexp=' + encodeURI(attr.checkExp)) : '');

        controlHtml = $(controlHtml);
        if (attr.optionData) { // optionData 为下拉项数据
            controlHtml.data('optiondata', attr.optionData);
        }
        if (attr.xtype == 'buttonlist' || attr.xtype == 'multi-buttonlist') {
            controlHtml.addClass('bh-label-radio-group');
        }

        controlHtml.data('jsonparam', attr.JSONParam);
        controlHtml.data('attr', attr);
        return controlHtml;
    };


    /**
     * @method placeHolder
     * @description ie9下为文本框/文本域添加placeholder
     * @param {object} ele 包含文本框的DOM容器 或者 文本框DOM
     * @method {String} [method=] 执行的方法， 默认为fix， 可选值 resize 用于重新定位 placeHolder
     * @example WIS_EMAP_INPUT.placeHolder($container);
     */
    WIS_EMAP_INPUT.placeHolder = function (ele, method) {
        if (document.documentMode == 9) {
            if (!ele) return;

            if (method == 'resize') {
                if ($(ele)[0].nodeName == 'INPUT') {
                    JPlaceHolder.resize($(ele).parent());
                } else {
                    JPlaceHolder.resize(ele);
                }
                return
            }
            if ($(ele)[0].nodeName == 'INPUT' || $(ele)[0].nodeName == 'TEXTAREA') {
                JPlaceHolder.fix($(ele).parent());
            } else {
                JPlaceHolder.fix(ele);
            }
        }
    };

    /**
     * @method extend
     * @description 表单控件扩展方法
     * @param {Object} component - 需要注册的表单控件方法对象
     * @param {String} component.xtype - 表单控件的xtype
     * @param {String} component.init - 表单控件的实例化方法 function默认参数  ele, params
     * @param {String} component.setValue - 表单控件的赋值方法 function默认参数  ele, name, val, root
     * @param {String} component.getValue - 表单控件的取值方法 function默认参数  ele, formData
     * @param {String} component.disable - 表单控件的禁用方法 function默认参数  ele
     * @param {String} component.enable - 表单控件的启用方法 function默认参数  ele
     * @example 
     * WIS_EMAP_INPUT.extend({
     *  xtype: 'xxx',
     *  init: function(ele, params) {},
     *  setValue: function(ele, name, val, root) {},
     *  getValue: function(ele, formData) {},
     *  disable: function(ele) {},
     *  enable: function(ele) {}
     * })
     */
    WIS_EMAP_INPUT.extend = function (component) {
        if (!component.xtype) return console && console.error('未指定自定义表单控件的xtype！');
        if (WIS_EMAP_INPUT.core[component.xtype]) return console && console.error('不能覆写表单默认控件类型' + compponent.xtype);
        WIS_EMAP_INPUT.component[component.xtype] = component;
    };

    

    WIS_EMAP_INPUT.component = (function () {
        return $.extend({}, WIS_EMAP_INPUT.core || {}, {});
    })();

    /**
     * @method getConvertCondition
     * @description 将表单取值数据转化为搜索条件
     * @param {Object} form_data - 表单数据
     * @param {Object} model - 数据模型
     * @param {Boolean} [operate_blank_value=false] - 是否处理空值（包含两部分 1.去除Value为空的数据  2.将value为@__blank__value的数据value变为""）
     * @return 高级搜索条件 
     */
    WIS_EMAP_INPUT.getConvertCondition = function (form_data, model, operate_blank_value) {
        var condition = [];
        var text_fields = model.map(function (item) {
            if (!item.xtype || item.xtype == 'text') {
                return item.name;
            }
        });
        for (var k in form_data) {
            if (operate_blank_value === true && form_data[k] === '') {
                continue;
            }
            if (/_DISPLAY$/.test(k)) continue;
            var modelItem = model.filter(function (item) {
                return item.name == k
            })[0];
            if (!modelItem) continue;
            var item_filter = {
                name: k,
                caption: modelItem.caption,
                linkOpt: "AND",
                builderList: modelItem.builderList,
                builder: modelItem.defaultBuilder,
                value: form_data[k]
            };
            if (form_data[k + '_DISPLAY'] !== undefined) {
                item_filter.value_display = form_data[k + '_DISPLAY'];
            }
            if (operate_blank_value === true) {
                item_filter.value = item_filter.value === '@__blank__value' ? '' : item_filter.value;
            }
            condition.push(item_filter);
        }
        return _adaptCondition(condition, model);
        // 搜索条件数据适配
        function _adaptCondition(condition, model) {
            var resultCondition = [];
            for (var i = 0; i < condition.length; i++) {
                resultCondition.push(condition[i]);
                var condition_item = resultCondition[i];
                if (!(condition_item instanceof Array)) {
                    var model_item = model.filter(function (m_item) {
                        return m_item.name == condition_item.name;
                    })[0];
                    var attr = WIS_EMAP_SERV.getAttr(model_item);
                    // 文本类型控件包含 , 时  builder转化为多值包含
                    if ((!attr.xtype || attr.xtype == 'text') && condition_item.value.indexOf(',') > 0) {
                        condition_item.builder = 'm_value_include';
                    }
                    // 按钮组类型的控件，将value转为string
                    else if (attr.xtype === 'buttonlist' || attr.xtype === 'multi-buttonlist') {
                        if (condition_item.value !== undefined && condition_item.value !== null) {
                            condition_item.value = condition_item.value + '';
                        }
                    }
                    // number 类型，过滤value中的非数字
                    else if (attr.xtype === 'number') {
                        if (condition_item.value) {
                            condition_item.value = condition_item.value.toString().replace(/\D/g, '')
                        }
                        condition_item.value = condition_item.value === null ? '' : numVal * 1;
                    }
                    // 下拉多选、复选框、多选按钮组类型, builder 转化为多值相等
                    else if (attr.xtype == 'multi-select2' || attr.xtype == 'checkboxlist' || attr.xtype == 'multi-buttonlist' || attr.xtype == 'multi-tree') {
                        // 对于空值选项 不支持多值相等
                        if (condition_item.value !== '@__blank__value' && /,/.test(condition_item.value)) {
                            condition_item.builder = 'm_value_equal';
                        } else if (condition_item.value === '@__blank__value' && (condition_item.builder === 'm_value_equal' || condition_item.builder === 'm_value_include')) {
                            // 多值相等或多值包含 下 选择空值时， 转为相等或包含
                            condition_item.builder = condition_item.builder.replace(/m_value_/, '');
                        }
                    }
                    // 类型为date-range日期范围  num-range数字区间 时, 拆分成 两个条件
                    else if (attr.xtype == 'date-range' || attr.xtype == 'number-range') {
                        var date_value = condition_item.value.split(',');
                        if (date_value[0] !== "") {
                            resultCondition.splice(i + 1, undefined, {
                                name: condition_item.name,
                                caption: condition_item.caption,
                                builder: 'moreEqual',
                                linkOpt: 'AND',
                                builderList: 'cbl_Other',
                                value: date_value[0]
                            });
                        }
                        if (date_value[1] !== "" && date_value[1] !== undefined) {
                            resultCondition.splice(i, 1, {
                                name: condition_item.name,
                                caption: condition_item.caption,
                                builder: 'lessEqual',
                                linkOpt: 'AND',
                                builderList: 'cbl_Other',
                                value: date_value[1]
                            });
                        }
                    }
                }
            }
            return resultCondition;
        }
    }

    /**
     * @method filterCondition
     * @description 过滤搜索条件，将空值('')去掉，将空白值(@__blank__value)设置为空值('')
     * @param {Array|String} condition - 搜索条件
     * @return {Array} - 过滤后的搜索条件
     */
    WIS_EMAP_INPUT.filterCondition = function (condition) {
        var con = condition;
        var result = [];
        if (typeof condition == 'string') {
            con = JSON.parse(con);
        }
        con.map(function (item, i) {
            if (item instanceof Array) {
                result.push(WIS_EMAP_INPUT.filterCondition(item));
            } else {
                if (item.value !== '') {
                    if (item.value === '@__blank__value') {
                        item.value = '';
                    }
                    result.push(item);
                }
            }
        })
        return result;
    }

    /**
     * @method getAttr
     * @description 根据模型项获取配置信息
     * @param {Object} item - 模型JSON对象
     * @param {String} type - 取值类型可选值 form grid search
     * @returns {Object} - 模型配置信息
     */
    WIS_EMAP_INPUT.getAttr = function(item, type) {
        if (!item.get) {
            if (type === undefined) {
                return console && console.error('数据模型缺少get方法或getAttr方法缺少type参数！');
            }
            item.get = function(field) {
                if (this[type + "." + field] !== undefined && this[type + "." + field] !== "")
                    return this[type + "." + field];
                else
                    return this[field];
            }
        }
        return {
            xtype: item.get("xtype") || 'text',
            dataType: item.get("dataType"),
            caption: item.get("caption"),
            col: item.get("col") ? item.get("col") : 1,
            url: item.get("url"),
            name: item.get("name"),
            hidden: item.get("hidden"),
            placeholder: item.get("placeholder") ? item.get("placeholder") : '',
            inputReadonly: item.get("readonly") ? true : false,
            required: item.get("required") ? "bh-required" : "",
            checkType: item.get("checkType") ? item.get("checkType") : false,
            checkSize: item.get("checkSize"),
            dataSize: item.get("dataSize") ? item.get("dataSize") : 99999,
            checkExp: item.get("checkExp"),
            JSONParam: item.get("JSONParam") ? item.get("JSONParam") : '{}',
            format: item.get("format"),
            defaultValue: item.get("defaultValue"),
            optionData: item.get("optionData"),
            quickSearch: item.get("quickSearch")
        }
    };

    /**
     * @method clone对象
     * @description 深度克隆对象
     * @param {Object} obj - 需要克隆的对象
     * @returns {Object} - 克隆结果
     * @example
     * WIS_EMAP_SERV.cloneObj({
     *  a: xx,
     *  b: xx,
     *  ...
     * })
     */
    WIS_EMAP_INPUT.cloneObj = function(obj) {
        var clone;
        if (obj instanceof Array) {
            clone = [];
            for (var i = 0; i < obj.length; i++) {
                clone.push(WIS_EMAP_INPUT.cloneObj(obj[i]));
            }
        } else {
            clone = {};
            for (var k in obj) {
                if (typeof obj[k] == 'Object') {
                    clone[k] = WIS_EMAP_INPUT.cloneObj(obj[k]);
                } else {
                    clone[k] = obj[k];
                }
            }
        }
        return clone;
    };

    /**
     * @method convertModel
     * @description 转换模型，给模型字段项加上get方法
     * @param {Object} model - 数据模型
     * @param {String} [type] - 类型 可选值  'form' 'grid' 'search'
     * @example 
     * WIS_EMAP_SERV.convertModel(dataModel);
     */
    WIS_EMAP_INPUT.convertModel = function(model, type) {
        if (model === undefined || model == null) {
            //getData = {code: 0,msg: "没有数据",models:[],datas:{}};
            return undefined;
        } else {
            if (type === undefined)
                return model.controls;
            else {
                if (model instanceof Array) {
                    addGetMethod(model);
                    return model;
                } else {
                    addGetMethod(model.controls);
                    if (type == "search")
                        return model;
                    else
                        return model.controls;
                }
            }
        }

        function addGetMethod(model_array) {
            model_array.map(function(item) {
                item.get = function(field) {
                    if (this[type + "." + field] !== undefined && this[type + "." + field] !== "")
                        return this[type + "." + field];
                    else
                        return this[field];
                }
            })
        }
    };    

    WIS_EMAP_INPUT.import = function (components) {
        WIS_EMAP_INPUT.component = WIS_EMAP_INPUT.component || {};

        for (var k in components) {
            if (WIS_EMAP_INPUT.component[k] !== undefined) {
                console && console.error('组件' + k + '已存在');
                continue;
            }
            WIS_EMAP_INPUT.component[k] = components[k];
        }        

    }

     WIS_EMAP_INPUT.allValidateRules = (function () {
        return $.extend({}, WIS_EMAP_INPUT.validateRules, {});
    })();

    /**
     * @method extendValidateRule
     * @description 扩展校验规则
     * @param {Object} rule - 添加的校验规则
     * @param {String} rule.name - 校验规则名称，使用时将其配置在字段模型的checkType属性上
     * @param {RegExp} rule.regex - 校验规则的正则表达式，与func 二选一必填
     * @param {Function} rule.func - 校验规则的处理函数，与func 二选一必填，带参数 value - 字段的值，函数返回Boolean，表示检验通过或者不通过；<br> 
     * 若是联动校验， 则带参数为 value - 字段的值， filed - 联动字段name， element - 表单DOM
     * @param {String} rule.alertText - 校验提示文字，其中使用 '* '字符串来代替字段的caption，<br>
     * 若是联动校验， 使用'*1'代表当前字段caption，使用'*2'代表联动字段的caption
     * @example 
     * WIS_EMAP_INPUT.extendValidateRule({
     *  name: 'test',
     *  alertText: '* 不正确',
     *  regex: /\d+/
     * })
     */
    WIS_EMAP_INPUT.extendValidateRule = function (rule) {
        if (WIS_EMAP_INPUT.allValidateRules[rule.name]) {
            return console && console.error(rule.name + '校验规则已存在！');
        }
        WIS_EMAP_INPUT.allValidateRules[rule.name] = rule;
    };



})(window.WIS_EMAP_INPUT = window.WIS_EMAP_INPUT || {});