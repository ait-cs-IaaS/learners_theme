$(function () {

    $(".gpdf").click(function () {
        generatePDF();
    });
});

function generatePDF() {
    var pdf = new jsPDF("p", "pt", "a4");


    // pdf.setFont("Rubik");
    // pdf.setFontType("normal");
    // pdf.setFontSize(28);
    // // console.log(rubik_font)
    // // pdf.addFont("Rubik-VariableFont_wght");
    // // pdf.setFontType('normal');
    // pdf.text(20,60,"TEST test")
    // source can be HTML-formatted string, or a reference
    // to an actual DOM element from which the text will be scraped.
    let source = $("#body-inner").clone()[0];

    let html = '<div id="pdfcontainer" style="position: absolute; top: -9999px">';
    html += cleanHTML(source).innerHTML;
    html += "</div>";
    $("#body-inner").append(html);

    source = $("#pdfcontainer")[0];
    

    // pdf.autoTable({
    //     html: $(source).find("table")[0],
    //     showHead: 'firstPage',
    //   })

    // we support special element handlers. Register them with jQuery-style
    // ID selector for either ID or node name. ("#iAmID", "div", "span" etc.)
    // There is no support for any other type of selectors
    // (class, of compound) at this time.
    specialElementHandlers = {
        // element with id of "bypass" - jQuery style selector
        "#bypassme": function (element, renderer) {
            // true = "handled elsewhere, bypass text extraction"
            return true;
        },
    };
    margins = {
        top: 80,
        bottom: 60,
        left: 80,
        width: 430,
    };

    // all coords and widths are in jsPDF instance's declared units
    // 'inches' in this case
    pdf.fromHTML(
        source, // HTML string or DOM elem ref.
        margins.left, // x coord
        margins.top, // y coord
        {
            jsPDF: document,
            autoPaging: "text",
            width: margins.width, // max width of content on PDF
            elementHandlers: specialElementHandlers,
        },

        function (dispose) {
            
            pdf.setFontSize(7);
            pdf.setTextColor("#9a9a9a");

            var pageTitle = $(source).find("h1:first").text().trim()
            
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                const pageSize = pdf.internal.pageSize;
                const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                const pageHeight = pageSize.height
                    ? pageSize.height
                    : pageSize.getHeight();
                const header = "Report: " + pageTitle;
                const footer = `Page ${i} of ${pageCount}`;

                // Header
                pdf.text(header, 80, 30, { baseline: "top" });

                // Footer
                pdf.text(
                    footer,
                    80,
                    pageHeight - 30,
                    { baseline: "bottom"}
                );
            }
            pdf.save("Report_" + pageTitle + ".pdf");
        },
        margins
    );

    $("#pdfcontainer").remove();
}

function cleanHTML(source) {
    $.each($(source).find("*"), function () {
        // console.log($(this))
        let element = $(this)[0];
        let tagName = $(element).prop("tagName");
        var k = parseInt($(tagName).css("font-size"));
        var redSize = (k * 80) / 100; //here, you can give the percentage( now it is reduced to 90%)
        $(element).css({ "font-size": redSize });
    });

    // $.each($(source).find("table"), function () {
    //     let element = $(this)[0];
    //     $(element).find("tr td").css({ "font-size": 8 });
    // });

    // console.log($(source).html())

    $.each($(source).find("a"), function () {
        $(this).replaceWith("<b style='color: #d34a5d'>" + this.innerHTML + "</b>");
    });

    $.each($(source).find("label"), function () {
        $(this).replaceWith("<b>" + this.innerHTML + "</b>");
    });

    $.each($(source).find("input[type=text]"), function () {
        let value = $(this).attr("value");
        replaceInputField(value, $(this));
    });

    $.each($(source).find("select"), function () {
        let value = $(this).find("option:selected").text();
        replaceInputField(value, $(this));
    });

    $.each($(source).find("textarea"), function () {
        let value = $(this).val();
        replaceInputField(value, $(this));
    });

    $(source).find("div.exercise-control").remove();
    $(source).find(".add-input-row").remove();
    $(source).find("button").remove();
    $(source).find("aside").remove();

    let map = { "’": "'" };
    $(source).html(
        // $(source).html().replace(/’;|&lt;|&gt;|&quot;|&#039;/g,
        $(source)
            .html()
            .replace(/’/g, function (m) {
                return map[m];
            })
    );

    return source;
}

function replaceInputField(value, element) {
    element.replaceWith(
        "<span style='padding-bottom: 10px; font-style: italic; color: #555555'>" +
        value +
        "</span>"
    );
}
