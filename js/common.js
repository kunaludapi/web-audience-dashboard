(function () {
    var charts = {
        'stock': {},
        'pie': {},
        'map': {}
    };
    var $datetimepicker_start = $('#datetimepicker_start');
    var $datetimepicker_end = $('#datetimepicker_end');

    var $blog_found = $('#table-blog-found');
    var $site_found = $('#table-site-found');
    var $most_popular = $('#table-most-popular');
    var $most_search_keyword = $('#table-search-keywords');

    var $nav = $('#nav-date-time');
    var today = new Date($nav.find('[data-range="today"]').data('time'));
    var from_min_date;

    var pattern_age_group = [
        {
            name: '< 18',
            from: 0,
            to: 17
        },
        {
            name: '18 - 24',
            from: 18,
            to: 24
        },
        {
            name: '25 - 34',
            from: 25,
            to: 34
        },
        {
            name: '35 - 44',
            from: 35,
            to: 44
        },
        {
            name: '> 45',
            from: 45
        }
    ];

    function web_audience_dashboard(rawData, filter) {
        var data = processData(rawData, filter);

        // create chart - Blog Visitors
        createStockChart_1('one', data['visitors']['blog_visitors'], 'blog-visitors', 'Blog Visitors');
        // create chart - Visitors
        createStockChart_2('two', data['visitors'], 'visitors', 'Visitors');
        // create chart - Audience Location
        createMap('one', data['location'], 'audience-location', 'Audience location');
        // create chart - Age Category
        createPieChart('one', data['age_info'], 'age-category', 'Visit by age category');
        // create chart - Device Category
        createPieChart('two', data['device_info'], 'device-category', 'Visit by device category');
        // create chart - Viewer's mobile devices
        createPieChart('three', data['device_info']['mobile'], 'mobile-devices', 'Viewer\'s mobile devices');

        // create table - How is your blog found
        createDataTable(data['visitors']['blog_visitors']['blog_url'], $blog_found);
        // create table - How links to you
        createDataTable(data['from_link'], $site_found);
        // create table - Most popular pages
        createDataTable(data['most_popular_page'], $most_popular);
        // create table - Most used search terms
        createDataTable(data['most_search_keyword'], $most_search_keyword);

        function createStockChart_1(index, data, container, title) {

            if (charts['stock'][index]) {
                charts['stock'][index].dispose();
                charts['stock'][index] = null;
            }

            var chart;
            var data_chart = [];

            var count = data['values'].length ? data['values'].reduce(function (a, b) {
                return a + b;
            }) : 0;

            for (var i = 0; i < data['categories'].length; i++) {
                data_chart.push([data['categories'][i], data['values'][i]]);
            }

            data_chart.sort(function (a, b) {
                var time_a = new Date(a[0]).getTime();
                var time_b = new Date(b[0]).getTime();
                return time_a - time_b
            });

            // chart type
            chart = anychart.stock();
            chart.title(title);
            chart.tooltip().textFormatter(function () {
                return 'Users: ' + this.points[0].value;
            });
            chart.padding('0px');

            // set the data
            var table = anychart.data.table();
            table.addData(data_chart);

            // map the data
            var mapping_blog_users = table.mapAs();
            mapping_blog_users.addField('value', 1);

            // set the series
            var users = chart.plot(0);
            users.line(mapping_blog_users);
            users.legend().itemsTextFormatter(function () {
                return 'Visitors: ' + (this.value  || 0)+ ' of ' + count
            });

            chart.tooltip().titleFormatter(function () {
                var date = new Date(this.hoveredDate);

                return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();
            });

            // set container id for the chart
            chart.container(container);
            // initiate chart drawing
            chart.draw();

            charts['stock'][index] = chart;
        }

        function createMap(index, data, container, title) {

            if (charts['map'][index]) {
                charts['map'][index].dispose();
                charts['map'][index] = null;
            }

            var map;
            var data_map = [];
            var world_map = anychart.maps.world.features;
            var count = data['values'].length ? data['values'].reduce(function (a, b) {
                return a + b;
            }) : 0;

            for (var i = 0; i < data['names'].length; i++) {
                data_map.push(
                    {
                        'id': data['names'][i],
                        'value': data['values'][i]
                    }
                );
            }

            for (var j = 0; j < world_map.length; j++) {
                if (data['names'].indexOf(world_map[j].properties.id) === -1) {
                    data_map.push({
                        'id': world_map[j].properties.id,
                        'value': 0
                    });
                }
            }

            map = anychart.map();
            map.unboundRegions();
            map.geoData(anychart.maps.world);
            map.allowPointsSelect(false);
            map.padding('0px');

            var map_title = map.title();
            map_title.enabled(true);
            map_title.text(title + ' (' + count + ' visitors)');
            map_title.padding().bottom('25px');

            var series = map.choropleth(data_map);
            series.hoverFill('#f48fb1');
            series.stroke('#ddd');
            series.hoverStroke(anychart.color.darken('#f48fb1'));
            series.selectFill('#c2185b');
            series.selectStroke(anychart.color.darken('#c2185b'));
            series.labels().enabled(false);
            series.tooltip().textWrap('byLetter').useHtml(true);
            series.tooltip().textFormatter(function () {
                return '<span style="color: #d9d9d9">Visitors</span>: ' + this.value;
            });

            var scale = anychart.scales.ordinalColor([
                {less: 0},
                {from: 1, to: 10},
                {from: 10, to: 20},
                {from: 20, to: 40},
                {from: 40, to: 75},
                {greater: 75}
            ]);
            scale.colors(
                [
                    '#eee',
                    '#4fc3f7',
                    '#039be5',
                    '#0288d1',
                    '#0277bd',
                    '#01579b'
                ]
            );

            var colorRange = map.colorRange();
            colorRange.enabled(true).padding([0, 0, 20, 0]);
            colorRange.ticks().stroke('3 #ffffff').position('center').length(7).enabled(true);
            colorRange.colorLineSize(5);
            colorRange.marker().size(7);
            colorRange.labels().fontSize(11).padding(3, 0, 0, 0).textFormatter(function () {
                var range = this.colorRange;
                var name;
                if (isFinite(range.start + range.end)) {
                    name = range.start + ' - ' + range.end;
                } else if (isFinite(range.start)) {
                    name = '> ' + range.start;
                } else {
                    if (range.end === 0) {
                        name = range.end;
                    } else {
                        name = '< ' + range.end;
                    }
                }
                return name
            });

            series.colorScale(scale);
            map.container(container);
            map.draw();

            charts['map']['one'] = map;
        }

        function createPieChart(index, data, container, title) {

            if (charts['pie'][index]) {
                charts['pie'][index].dispose();
                charts['pie'][index] = null;
            }

            var chart;
            var data_chart = [];
            var count;

            if (data['values'].length) {
                count = data['values'].reduce(function (a, b) {
                    return a + b;
                });
            } else {
                count = 0;
            }

            for (var i = 0; i < data['categories'].length; i++) {
                data_chart.push(
                    {
                        'name': data['categories'][i],
                        'value': data['values'][i]
                    }
                );
            }

            // set data and chart type
            chart = anychart.pie(data_chart);
            // create empty area in pie chart
            chart.innerRadius('65%');
            chart.overlapMode(true);
            // set the insideLabelsOffset
            chart.insideLabelsOffset("-55%");
            chart.title(title);
            chart.padding('0px');
            chart.tooltip().textFormatter(function () {
                return 'Visitors: ' + this.value + '\n' + 'Percent Value: '
            });

            // set chart labels settings
            var labels = chart.labels();
            labels.enabled(true);
            labels.fontColor("#60727B");
            labels.position("outside");
            labels.fontWeight('bold');
            labels.textFormatter(function () {
                return this.value
            });

            // set chart label settings
            var label_1 = chart.label(0);
            label_1.text('<span style="font-size: 32px; color: #A0B1BA;">' +
                count + '</span>');
            label_1.position("center");
            label_1.anchor("center");
            label_1.offsetY("-10px");
            label_1.useHtml(true);

            // set chart label settings
            var label_2 = chart.label(1);
            label_2.text('<span style="20px; color: #bbb;">' + 'Visitors' + '</span>');
            label_2.position("center");
            label_2.anchor("center");
            label_2.offsetY("15px");
            label_2.useHtml(true);

            // set container id for the chart
            chart.container(container);
            // init chart
            chart.draw();

            charts['pie'][index] = chart;
        }

        function createStockChart_2(index, data, container, title) {

            if (charts['stock'][index]) {
                charts['stock'][index].dispose();
                charts['stock'][index] = null;
            }

            var chart;
            var data_chart = [];

            var count_users = data['users'].length ? data['users'].reduce(function (a, b) {
                return a + b;
            }) : 0;

            var count_new_users = data['new_users'].length ? data['new_users'].reduce(function (a, b) {
                return a + b;
            }) : 0;

            // chart type
            chart = anychart.stock();
            chart.title(title);
            chart.padding('0px');

            for (var i = 0; i < data['date'].length; i++) {
                data_chart.push([data['date'][i], data['users'][i], data['new_users'][i]]);
            }

            data_chart.sort(function (a, b) {
                var time_a = new Date(a[0]).getTime();
                var time_b = new Date(b[0]).getTime();
                return time_a - time_b
            });

            chart.tooltip().titleFormatter(function () {
                var date = new Date(this.hoveredDate);

                return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();
            });

            chart.tooltip().textFormatter(function () {
                return 'Visitors: ' + this.points[0].value + '\n' + 'New Visitors: ' + this.points[1].value;
            });

            // set the data
            var table = anychart.data.table();
            table.addData(data_chart);

            // map the data
            var mapping_users = table.mapAs();
            mapping_users.addField('value', 1);
            var mapping_users_unique = table.mapAs();
            mapping_users_unique.addField('value', 2);

            // set the series
            var users = chart.plot(0);
            users.splineArea(mapping_users).fill('#1976d2 0.65').stroke('1.5 #1976d2');
            users.legend().itemsTextFormatter(function () {
                return 'Visitors: ' + (this.value || 0) + ' of ' + count_users
            });

            var users_unique = chart.plot(1);
            users_unique.splineArea(mapping_users_unique).fill('#ef6c00 0.65').stroke('1.5 #ef6c00');
            users_unique.legend().itemsTextFormatter(function () {
                return 'New Visitors: ' + (this.value || 0) + ' of ' + count_new_users
            });

            // set container id for the chart
            chart.container(container);
            // init chart
            chart.draw();

            charts['stock'][index] = chart;
        }

        function createDataTable(data, $el) {
            var $tbody = $el.find('tbody');
            // init DataTable
            var $table = $tbody.parent('table').DataTable({
                scrollY: '225px',
                scrollCollapse: true,
                paging: false,
                "dom": '<"top"f>rtip'
            });

            if ($tbody.children().length) {
                $table.clear();
                $table.draw();
            }

            // update table
            for (var i = 0; i < data.categories.length; i++) {
                if (data['unique_values'] !== undefined) {
                    $table.row.add([data['categories'][i], data['values'][i], data['unique_values'][i] + ' (' +
                        (data['unique_values'][i] * 100 / data['values'][i]).toFixed(2) + '%)'])
                        .draw();
                } else {
                    $table.row.add([data['categories'][i], data['values'][i]])
                        .draw();
                }
            }

        }
    }

    function processData(rawData, filter) {
        var data;

        // return data by filter if filter exist
        if (filter) {
            data = rawData.filter(function (item) {
                var time = (new Date(item['date'])).getTime();
                var start_date = (new Date(filter['start-date'])).getTime();
                var end_date = (new Date(filter['end-date'])).getTime();

                return time >= start_date && time <= end_date
            });
        } else {
            data = rawData;
        }

        // search min date
        rawData.sort(function (visitor_a, visitor_b) {
            var time_a = new Date(visitor_a['date']).getTime();
            var time_b = new Date(visitor_b['date']).getTime();
            return time_a - time_b
        });

        // set min date from data
        from_min_date = new Date(rawData[0]['date']);
        initFullTimeDate(filter, from_min_date, today);

        var index;
        var i;

        var visitors = [];
        var unique_visitors = [];
        var date_categories = [];

        var blog_visitors = [];
        var blog_visitors_categories = [];
        var blog_visitors_values = [];

        var location_categories = [];
        var location_values = [];

        var blog_from_url_categories = [];
        var blog_from_url_values = [];
        var blog_from_url_unique_visitor = [];

        var from_link_categories = [];
        var from_link_values = [];
        var from_link_values_unique = [];

        var most_popular_page_categories = [];
        var most_popular_page_values = [];
        var most_popular_page_values_unique = [];

        var most_search_keyword_categories = [];
        var most_search_keyword_values = [];

        var age_categories = [];
        var age_values = [];
        var age_categories_values = [];

        var device_categories = [];
        var device_values = [];
        var device_type = [];
        var device_user_agent_categories = [];
        var device_user_agent_type = [];
        var device_user_agent_values = [];
        var mobile_device_categories = [];
        var mobile_device_values = [];

        for (i = 0; i < data.length; i++) {
            if (data[i]['date']) {
                if (date_categories.indexOf(data[i]['date']) === -1) {
                    date_categories.push(data[i]['date']);
                }
            }
            if (data[i]['url']) {
                if (data[i]['url'].indexOf('blog') !== -1) {
                    blog_visitors.push(data[i]);
                }
                if (data[i]['url'].indexOf('search') !== -1) {
                    if (most_search_keyword_categories.indexOf(data[i]['keywords']) === -1) {
                        most_search_keyword_categories.push(data[i]['keywords']);
                    }
                }
                if (most_popular_page_categories.indexOf(data[i]['url']) === -1) {
                    most_popular_page_categories.push(data[i]['url']);
                }
            }
            if (data[i]['location']) {
                if (location_categories.indexOf(data[i]['location']) === -1) {
                    location_categories.push(data[i]['location']);
                }
            }
            if (data[i]['from']) {
                if (from_link_categories.indexOf(data[i]['from']) === -1) {
                    from_link_categories.push(data[i]['from']);
                }
            }
            if (data[i]['device']) {
                if (device_categories.indexOf(data[i]['device']) === -1) {
                    device_categories.push(data[i]['device']);
                }
            }
        }

        for (i = 0; i < date_categories.length; i++) {
            unique_visitors.push(0);
            visitors.push(0);
        }

        for (i = 0; i < pattern_age_group.length; i++) {
            pattern_age_group[i].to = pattern_age_group[i].to !== undefined ? pattern_age_group[i].to : 'x';
            age_categories_values.push([pattern_age_group[i].from, pattern_age_group[i].to]);
            age_categories.push(pattern_age_group[i].name);
            age_values.push(0);
        }

        for (i = 0; i < location_categories.length; i++) {
            location_values.push(0);
        }

        for (i = 0; i < from_link_categories.length; i++) {
            from_link_values.push(0);
            from_link_values_unique.push(0)
        }

        for (i = 0; i < most_popular_page_categories.length; i++) {
            most_popular_page_values.push(0);
            most_popular_page_values_unique.push(0);
        }

        for (i = 0; i < most_search_keyword_categories.length; i++) {
            most_search_keyword_values.push(0);
        }

        for (i = 0; i < blog_visitors.length; i++) {
            if (blog_visitors_categories.indexOf(blog_visitors[i]['date']) === -1) {
                blog_visitors_values.push(0);
                blog_visitors_categories.push(blog_visitors[i]['date']);
            }
            if (blog_from_url_categories.indexOf(blog_visitors[i]['from']) === -1) {
                blog_from_url_values.push(0);
                blog_from_url_unique_visitor.push(0);
                blog_from_url_categories.push(blog_visitors[i]['from']);
            }
        }

        for (i = 0; i < data.length; i++) {
            if (data[i]['age']) {
                for (j = 0; j < age_categories.length; j++) {
                    var tmp = age_categories_values[j][1] === 'x' ? (+data[i]['age'] + 1) : age_categories_values[j][1];
                    if (age_categories_values[j][0] <= data[i]['age'] && tmp >= data[i]['age']) {
                        age_values[j] += 1;
                        break;
                    }
                }
            }
        }

        for (i = 0; i < device_categories.length; i++) {
            device_values.push(0);
        }

        for (i = 0; i < data.length; i++) {
            index = date_categories.indexOf(data[i]['date']);
            if (index !== -1) {
                visitors[index]++;
                if (data[i]['unique'] === 'true') {
                    unique_visitors[index]++;
                }
            }
            index = location_categories.indexOf(data[i]['location']);
            if (index !== -1) {
                location_values[index]++;
            }
            index = from_link_categories.indexOf(data[i]['from']);
            if (index !== -1) {
                from_link_values[index]++;
                if (data[i]['unique'] === 'true') {
                    from_link_values_unique[index]++;
                }
            }
            index = blog_visitors_categories.indexOf(data[i]['date']);
            if (index !== -1 && data[i]['url'].indexOf('blog') !== -1) {
                blog_visitors_values[index]++;
            }
            if (data[i]['url'].indexOf('blog') !== -1) {
                index = blog_from_url_categories.indexOf(data[i]['from']);
                if (index !== -1) {
                    blog_from_url_values[index]++;
                    if (data[i]['unique'] === 'true') {
                        blog_from_url_unique_visitor[index]++;
                    }
                }
            }
            index = most_popular_page_categories.indexOf(data[i]['url']);
            if (index !== -1) {
                most_popular_page_values[index]++;
                if (data[i]['unique'] === 'true') {
                    most_popular_page_values_unique[index]++;
                }
            }
            index = most_search_keyword_categories.indexOf(data[i]['keywords']);
            if (index !== -1) {
                most_search_keyword_values[index]++;
            }
            index = device_categories.indexOf(data[i]['device']);
            if (index !== -1) {
                device_values[index]++;
            }
        }

        for (i = 0; i < device_categories.length; i++) {
            device_user_agent_categories.push(detectUserAgent(device_categories[i]));
        }

        for (i = 0; i < device_user_agent_categories.length; i++) {
            device_user_agent_type.push(detectDevice(device_user_agent_categories[i]));
        }

        for (i = 0; i < device_user_agent_type.length; i++) {
            if (device_type.indexOf(device_user_agent_type[i]) === -1) {
                device_type.push(device_user_agent_type[i]);
                device_user_agent_values.push(0);
            }
        }

        for (i = 0; i < device_user_agent_type.length; i++) {
            index = device_type.indexOf(device_user_agent_type[i]);
            device_user_agent_values[index] += device_values[i];
            if (device_user_agent_type[i] === 'mobile') {
                mobile_device_categories.push(device_categories[i]);
                mobile_device_values.push(0);
            }
        }

        for (i = 0; i < data.length; i++) {
            index = mobile_device_categories.indexOf(data[i]['device']);
            if (index !== -1) {
                mobile_device_values[index]++;
            }
        }

        return {
            'location': {
                'names': location_categories,
                'values': location_values
            },
            'visitors': {
                'users': visitors,
                'new_users': unique_visitors,
                'date': date_categories,
                'blog_visitors': {
                    'categories': blog_visitors_categories,
                    'values': blog_visitors_values,
                    'visitors': blog_visitors,
                    'blog_url': {
                        'categories': blog_from_url_categories,
                        'values': blog_from_url_values,
                        'unique_values': blog_from_url_unique_visitor
                    }
                }
            },
            'from_link': {
                'categories': from_link_categories,
                'values': from_link_values,
                'unique_values': from_link_values_unique
            },
            'most_popular_page': {
                'categories': most_popular_page_categories,
                'values': most_popular_page_values,
                'unique_values': most_popular_page_values_unique
            },
            'most_search_keyword': {
                'categories': most_search_keyword_categories,
                'values': most_search_keyword_values
            },
            'age_info': {
                'categories': age_categories,
                'values': age_values
            },
            'device_info': {
                'categories': device_type,
                'values': device_user_agent_values,
                'mobile': {
                    'categories': mobile_device_categories,
                    'values': mobile_device_values
                }
            }
        };
    }

    function heightInit() {
        var mq = window.matchMedia("(min-width: 768px)");
        var $chart_container = $('.chart_container');
        var $chart = $('.chart');
        // sum of padding/margin and container-timeline height
        var offsetHeight = 145 + $('#container-timeline').height();

        // if parent != iframe
        if (self === top) {
            if (mq.matches) {
                var height = $(window).height() - offsetHeight;
                $chart.css('height', height / 2);
                $chart_container.matchHeight();
            } else {
                $chart.css('height', 350);
            }
        }
    }

    function hidePreloader() {
        $('#loader-wrapper').fadeOut('slow');
    }

    function init(filter) {
        // replace this line with your data
        var rawData = visitors_data();
        // draw dashboard
        web_audience_dashboard(rawData, filter);
        heightInit();
    }

    function initDateTime() {
        $datetimepicker_start.datetimepicker();
        $datetimepicker_end.datetimepicker({
            useCurrent: false //Important! See issue #1075
        });

        $datetimepicker_start.on("dp.change", function (e) {
            $datetimepicker_end.data("DateTimePicker").minDate(e.date);
            $(this).datetimepicker('hide');

            $nav.find('li').removeClass('active');

            if ($datetimepicker_end.data("DateTimePicker").date() !== null) {
                // init with new data filter
                init({
                    'start-date': $(this).data('DateTimePicker').date().toDate(),
                    'end-date': $datetimepicker_end.data('DateTimePicker').date().toDate()
                });

            }
        });

        $datetimepicker_end.on("dp.change", function (e) {
            $datetimepicker_start.data("DateTimePicker").maxDate(e.date);
            $(this).datetimepicker('hide');

            $nav.find('li').removeClass('active');

            if ($datetimepicker_start.data("DateTimePicker").date() !== null) {
                // init with new data filter
                init({
                    'start-date': $datetimepicker_start.data('DateTimePicker').date().toDate(),
                    'end-date': $(this).data("DateTimePicker").date().toDate()
                });
            }
        });
    }

    function initFullTimeDate(filter, from, to) {
        if (!filter) {
            $datetimepicker_start.data('DateTimePicker').date(from);
            $datetimepicker_end.data('DateTimePicker').date(to);
        }
    }

    // time line events
    $nav.on('click', 'a', function () {
        var range = $(this).data('range');
        var from;
        var to;

        if ($(this).closest('li').hasClass('active')) {
            return false
        }

        switch (range) {
            case 'today':
            {
                from = new Date(today.getFullYear(), today.getMonth(), (today.getDate() - 1));
                to = today;
                break;
            }
            case 'yesterday':
            {
                from = new Date(today.getFullYear(), today.getMonth(), (today.getDate() - 2));
                to = new Date(today.getFullYear(), today.getMonth(), (today.getDate() - 1));
                break;
            }
            case 'week':
            {
                from = new Date(today.getFullYear(), today.getMonth(), (today.getDate() - 6));
                to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                break;
            }
            case 'month':
            {
                from = new Date(today.getFullYear(), today.getMonth() - 1, (today.getDate()));
                to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                break;
            }
            case 'quarter':
            {
                from = new Date(today.getFullYear(), today.getMonth() - 4, (today.getDate()));
                to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                break;
            }
            case 'year':
            {
                from = new Date(today.getFullYear(), 0, 0);
                to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                break;
            }
            case 'full':
            {
                from = from_min_date;
                to = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            }
        }

        // set datetime for input date
        $datetimepicker_start.data('DateTimePicker').date(from);
        $datetimepicker_end.data('DateTimePicker').date(to);

        $(this).parents($nav).find('li').removeClass('active');
        $(this).closest('li').addClass('active');
    });

    anychart.onDocumentReady(function () {
        initDateTime();
        init();

        $('[data-range="full"]').closest('li').addClass('active');
    });

    $(window).on('load', function () {
        hidePreloader();
    });

    $(window).bind('resize', heightInit);
})();

