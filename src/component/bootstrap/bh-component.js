var bs = {
  // 下拉框
  "bs-text": {
    "init": function (ele, params) {
      ele.html('<input type="text" class="form-control" placeholder="Email">');
      ele.on('change', function () {
        ele.trigger('_formChange');
      })
    },
    "setValue": function (ele, name, val, root) {
      if (val[name] === undefined || val[name] === null) {
        // 清空字段
        ele.find('[type=text]input').val('');
        return;
      }
      ele.find('[type=text]input').val(val[name]);

    },
    "getValue": function (ele, formData) {
      return ele.find('[type=text]input').val();
    },
    "disable": function (ele) {
      ele.find('[type=text]input')[0].setAttribute('disabled', true);
    },
    "enable": function (ele) {
      ele.find('[type=text]input')[0].setAttribute('disabled', false);
    }
  },

  "bs-select": {
    "init": function (ele, params) {
      var select = $('<select class="form-control"></select>');
      if (ele.data('optiondata')) {
        var optionData = typeof ele.data('optiondata') === 'string' ? JSON.parse(ele.data('optiondata')) : ele.data('optiondata');
        optionData.map(function (item) {
          select.append('<option value="' + item.id + '">' + item.name + '</option>');
        })
        ele.append(select);
      }
      ele.on('change', function () {
        ele.trigger('_formChange');
      })
    },
    "setValue": function (ele, name, val, root) {
      if (val[name] === undefined || val[name] === null) {
        // 清空字段
        ele.find('select').val('');
        return;
      }
    },
    "getValue": function (ele, formData) {
      return ele.find('select').val()
    },
    "disable": function (ele) {
      ele.find('select')[0].setAttribute('disabled', true);
    },
    "enable": function (ele) {
      ele.find('select')[0].setAttribute('disabled', false);
    }
  }
};