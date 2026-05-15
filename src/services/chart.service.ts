export class ChartService {
    private static QUICKCHART_BASE_URL = 'https://quickchart.io/chart';

    static generatePieChartUrl(data: { name: string; amount: number }[], title: string) {
        const labels = data.map(d => d.name);
        const values = data.map(d => d.amount);

        const chartConfig = {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                    ]
                }]
            },
            options: {
                title: {
                    display: true,
                    text: title
                },
                plugins: {
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold' }
                    }
                }
            }
        };

        return `${this.QUICKCHART_BASE_URL}?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
    }

    static generateBarChartUrl(income: number, expenses: number, title: string) {
        const chartConfig = {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    label: 'Amount',
                    data: [income, expenses],
                    backgroundColor: ['#4BC0C0', '#FF6384']
                }]
            },
            options: {
                title: {
                    display: true,
                    text: title
                },
                scales: {
                    yAxes: [{
                        ticks: { beginAtZero: true }
                    }]
                }
            }
        };

        return `${this.QUICKCHART_BASE_URL}?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
    }
}
