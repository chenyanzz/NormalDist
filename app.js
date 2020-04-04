function px(num) {
    return `${num}px`
}

//道尔顿板
class DtBoard {
    constructor(holder, level) {
        this.holder = holder;

        this.level = level;
        this.width = holder.width();
        this.height = holder.height();

        //像素

        this.stick_size = Math.min(this.width, this.height) / (1.618 * level);//柱子直径

        this.spacing_x = this.width / (level + 1);//柱子横向间隔
        this.spacing_y = this.height / (level + 1);//柱子竖向间隔

        this.particle_size = this.stick_size / 1.618;//粒子直径
        this.particle_speed = 0.1;//粒子走过一层的时间(s)
        this.particle_color = "rgba(21,159,238,0.8)";

        this.stick_color = "rgba(75,194,112,0.8)";
    }

    //获取level行，n个柱子的圆心坐标，从1开始
    getStickPosition(level, n) {
        return {
            x: (this.width / 2) + this.spacing_x * (n - (level + 1) / 2.0),
            y: level * this.spacing_y
        }
    }

    drawBoard() {

        for (var lv = 1; lv <= this.level; lv++) {
            for (var n = 1; n <= lv; n++) {
                var p = this.getStickPosition(lv, n);
                // console.log(`Stick at (${p.x},${p.y})`);

                this.holder.append($("<div></div>").css({
                    "position": "absolute",
                    "height": px(this.stick_size),
                    "width": px(this.stick_size),
                    "left": px(p.x - this.stick_size / 2),
                    "top": px(p.y - this.stick_size / 2),
                    "background": this.stick_color,
                    "border-radius": "50%",
                    "zorder": 1
                }));
            }
        }
    }


}

function my_rand(seed) {
    seed = (seed * 9301 + 49297) % 233280; //为何使用这三个数?
    return seed / (233280.0);
};

class Particle {
    constructor(board, onDelete) {
        this.board = board
        this.onDelete = onDelete
    }

    execAnim() {
        for (var lv = 1; lv < this.board.level; lv++) {

            var seed = new Date().getTime();

            var randBin = parseInt(Math.random() * 100000) % 2;
            var randDir = randBin ? -1 : 1;

            this.x += randBin ? 1 : 0;

            this.particle.animate({
                "left": `+=${randDir * this.board.spacing_x / 2}px`,
                "top": `+=${this.board.spacing_y}px`,
            }, { duration: this.board.particle_speed * 1000, queue: true });

        }
    }

    start() {
        p = this.board.getStickPosition(1, 1);
        this.particle = $("<div></div>").css({
            "position": "absolute",
            "height": px(this.board.particle_size),
            "width": px(this.board.particle_size),
            "left": px(p.x - this.board.particle_size / 2),
            "top": px(p.y - this.board.particle_size / 2),
            "background": this.board.particle_color,
            "border-radius": "50%",
            "zorder": 5,
            "animation-timing-function": "ease-in"
        });

        this.board.holder.append(this.particle);
        this.particle = this.board.holder.children(":last-child");
        this.lv = 1;
        this.x = 0;

        this.execAnim();

        var the = this;

        setTimeout(function () {
            the.particle.remove();
            console.log("x=" + the.x);
            the.onDelete(the.x);
        }, (this.board.level - 1) * this.board.particle_speed * 1000);

    }

}

//获取、验证输入
function getUserInput() {

    height = parseInt($("#ipt-height").val());
    speed = $("#ipt-speed").val();
    if (!height || height < 2) {
        alert("请输入高度");
        return;
    }
    if (!speed || speed < 1) {
        alert("请输入速度");
        return;
    }

    console.log("level=" + height);
    console.log("speed=" + speed);

    return {
        level: height,
        speed: speed
    }
}

var isRunning = false;

//on btn click
function start_simulation() {

    input = getUserInput();

    if (!input) return;

    $("#btn-start").css({"display":"none"});

    board_holder = $("#canvas-holder1");

    board_holder.css({
        "position": "absolute",
        "left": "0px",
        "top": px($("form").height()),
        "width": "100%",
        "height": "70%"
    })

    board = new DtBoard(board_holder, input.level);
    board.drawBoard();

    echart_holder = $("#canvas-holder2");

    echart_holder.css({
        "position": "absolute",
        "left": "0px",
        "top": px($("form").height() + board_holder.height()),
        "width": "100%",
        "height": "70%"
    })

    var dom = document.getElementById("canvas-holder2");
    // console.log(dom);
    var chart = echarts.init(dom);

    var data = []
    var xData = []

    for (var i = 0; i < input.level; i++) {
        xData[i] = i + 1;
        data[i] = 0;
    }

    var chart_option = {
        xAxis: {
            name: '坐标',
            type: 'category',
            data: xData
        },
        yAxis: {
            name: '频数',
            type: 'value'
        },
        series: [{
            data: data,
            type: 'line',
            smooth: true
        }]
    };

    chart.setOption(chart_option);

    on_resume();

    window.setInterval(function () {
        if (!isRunning) return;
        p = new Particle(board, function (x) {
            chart_option.series[0].data[x]++;
        });
        p.start();
    }, 1000.0 / input.speed);

    window.setInterval(function () {
        if (!isRunning) return;
        chart.setOption(chart_option);
    }, 250);
}

function on_start(){
    start_simulation();
}

function on_pause() {
    isRunning=false;
    $("#btn-pause").css({"display":"none"});
    $("#btn-resume").css({"display":"inline"});
}

function on_resume() {
    isRunning=true;
    $("#btn-resume").css({"display":"none"});
    $("#btn-pause").css({"display":"inline"});
}