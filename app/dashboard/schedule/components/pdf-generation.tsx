import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer, Font } from "@react-pdf/renderer";
import { DeliverySchedule } from '@/types/delivery-schedule';
import { Store } from '@/types/store';
import { Depot } from '@/types/depot';
import { PriorityType } from '@/types/package';


const styles = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        flexDirection: 'column',
        backgroundColor: '#fff',
        padding: 40,
        paddingVertical: 60,
        fontSize: 12,
    },
    section: {
        margin: 10,
    },
    header: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 18,
        fontWeight: 600,
        textAlign: 'center',
        marginBottom: 20,

    },
    title: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 16,
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 12,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    table: {
        display: 'flex',
        flexDirection: 'column',
        fontSize: 10,
        borderBottom: 1,
    },
    tableRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderLeft: 1,
        borderColor: '#000',
    },
    tableRowHeader: {
        backgroundColor: '#eee',
        borderLeft: 1,
    },
    tableColHeader: {
        width: '25%',
        borderRightWidth: 1,
        padding: 5,
        borderColor: '#000',
    },
    tableCol: {
        width: '25%',
        borderRightWidth: 1,
        padding: 5,
        borderColor: '#000',
    },
    tableColThin: {
        width: '15%',
        borderRightWidth: 1,
        padding: 5,
        borderColor: '#000',
    },
    tableColNum: {
        width: '8%',
        borderRightWidth: 1,
        padding: 5,
        borderColor: '#000',
    },
    tableCellHeader: {
        padding: 5,
        fontWeight: 'bold',
    },
    tableCell: {
        padding: 5,
    },
    grid: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    gridBox: {
        width: '33%',
    }
});

interface ScheduleReportProps {
    schedules: DeliverySchedule[];
    store: Store | undefined
    depot: Depot | undefined
}


export const ScheduleReport: React.FC<ScheduleReportProps> = (props) => {
    const totalDrivingTimeHours = (props.schedules.reduce((sum, schedule) => sum + schedule.actual_duration_mins, 0) / 60).toFixed(2) as unknown as number;
    const totalDistanceMiles = props.schedules.reduce((sum, schedule) => sum + schedule.actual_distance_miles, 0).toFixed(2) as unknown as number;
    const totalLoadWeight = props.schedules.reduce((sum, schedule) => sum + schedule.load_weight, 0).toFixed(2) as unknown as number;
    const totalLoadVolume = props.schedules.reduce((sum, schedule) => sum + schedule.load_volume, 0).toFixed(2) as unknown as number;
    const totalMaxWeight = props.schedules.reduce((sum, schedule) => sum + schedule.vehicle.max_load, 0).toFixed(2) as unknown as number;
    const totalMaxVolume = props.schedules.reduce((sum, schedule) => sum + schedule.vehicle.max_volume, 0).toFixed(2) as unknown as number;
    const totalPackages = props.schedules.reduce((sum, schedule) => sum + schedule.num_packages, 0);
    const totalVehicles = props.schedules.reduce((sum, schedule) => schedule.vehicle ? sum + 1 : sum, 0);

    // All generated solutions for comparison
    const allSolutions = props.schedules[0].schedule_report?.other_solutions;

    // Find Solutions
    const randomOnlySolution = allSolutions?.filter(solution => solution.initialiser === "Random" && solution.optimiser === "None")[0];
    const kMeansOnlySolution = allSolutions?.filter(solution => solution.initialiser === "KMeans" && solution.optimiser === "None")[0];
    const randomGASolution = allSolutions?.filter(solution => solution.initialiser === "Random" && solution.optimiser === "Genetic Algorithm")[0];
    const kMeansGASolution = allSolutions?.filter(solution => solution.initialiser === "KMeans" && solution.optimiser === "Genetic Algorithm")[0];

    // Create array of solutions which are not undefined
    const otherScheduleReports = [randomOnlySolution, kMeansOnlySolution, randomGASolution, kMeansGASolution].filter(solution => solution);
    const bestScheduleReport = props.schedules[0].schedule_report;

    return (
        <>
            {props.schedules && props.store && props.depot &&
                <PDFViewer style={{ width: '100%', height: '90vh' }}>
                    <Document>
                        <Page size="A4" style={styles.page}>
                            <Text style={styles.header}>FastTrak Schedule Report</Text>

                            {/* Overview */}
                            <View style={styles.section}>
                                <Text style={styles.title}>Overview</Text>
                                <Text>Store Name: {props.store.store_name}</Text>
                                <Text>Depot Name: {props.depot.depot_name}</Text>
                                <Text>Delivery Date: {new Date(props.schedules[0].delivery_date).toLocaleDateString('en-GB')}</Text>
                                <Text>Vehicles: {totalVehicles}</Text>
                                <Text>Packages: {totalPackages}</Text>
                                <Text>Standard Priority: {props.schedules.reduce((total, schedule) => total + schedule.package_order.filter(order => order.priority === PriorityType.Standard).length, 0)}</Text>
                                <Text>Express Priority: {props.schedules.reduce((total, schedule) => total + schedule.package_order.filter(order => order.priority === PriorityType.Express).length, 0)}</Text>
                            </View>

                            {/* Schedule Profile */}
                            <View style={styles.section}>
                                <Text style={styles.title}>Schedule Profile</Text>
                                <Text>Auto-Minimise (Y/N): {props.schedules[0].schedule_report?.auto_minimise ? "Y" : "N"}</Text>
                                <Text>Optimisation Profile: {props.schedules[0].schedule_report?.optimisation_profile}</Text>
                                <Text>Time Window: {props.schedules[0].schedule_report?.time_window_hours} hours</Text>
                                <Text>Estimated Time Per Delivery: {props.schedules[0].schedule_report?.est_delivery_time} minutes</Text>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.title}>Vehicles</Text>
                                <View style={styles.table}>
                                    <View style={[styles.tableRow, styles.tableRowHeader]}>
                                        <Text style={styles.tableColNum}>#</Text>
                                        <Text style={styles.tableColHeader}>Vehicle</Text>
                                        <Text style={styles.tableColThin}>Packages</Text>
                                        <Text style={styles.tableColHeader}>Load Utilisation (kg)</Text>
                                        <Text style={styles.tableColHeader}>Volume (m³)</Text>
                                        <Text style={styles.tableColThin}>Distance (mi)</Text>
                                        <Text style={styles.tableColThin}>Time (hrs)</Text>
                                    </View>
                                    {/* Rows */}
                                    {props.schedules.map((schedule, index) =>
                                        schedule.vehicle && (
                                            <View key={index} style={styles.tableRow}>
                                                <Text style={styles.tableColNum}>{index + 1}</Text>
                                                <Text style={styles.tableCol}>{schedule.vehicle.registration}</Text>
                                                <Text style={styles.tableColThin}>{schedule.num_packages}</Text>
                                                <Text style={styles.tableCol}>{`${schedule.load_weight.toFixed(0)}/${schedule.vehicle.max_load.toFixed(0)} (${(schedule.load_weight / schedule.vehicle.max_load * 100).toFixed(0)}%)`}</Text>
                                                <Text style={styles.tableCol}>{`${schedule.load_volume.toFixed(1)}/${schedule.vehicle.max_volume.toFixed(1)} (${(schedule.load_volume / schedule.vehicle.max_volume * 100).toFixed(0)}%)`}</Text>
                                                <Text style={styles.tableColThin}>{schedule.actual_distance_miles.toFixed(1)}</Text>
                                                <Text style={styles.tableColThin}>{(schedule.actual_duration_mins / 60).toFixed(2)}</Text>
                                            </View>
                                        )
                                    )}
                                </View>
                            </View>
                        </Page>
                        <Page size="A4" style={styles.page}>
                            {/* Schedule Profile */}
                            <View style={styles.section}>
                                <Text style={styles.title}>Performance</Text>
                                <View style={styles.grid}>
                                    <View style={styles.gridBox}>
                                        <Text style={styles.subtitle}>Total</Text>
                                        <Text>Packages: {props.schedules.reduce((sum, schedule) => schedule.num_packages ? sum + schedule.num_packages : sum, 0)}</Text>
                                        <Text>Driving Time: {totalDrivingTimeHours} hours</Text>
                                        <Text>Distance: {totalDistanceMiles} miles</Text>
                                        <Text>Weight: {totalLoadWeight} kg</Text>
                                        <Text>Volume: {totalLoadVolume} m³</Text>
                                    </View>
                                    <View style={styles.gridBox}>
                                        <Text style={styles.subtitle}>Average Per Vehicle</Text>
                                        <Text>Packages: {(totalPackages / totalVehicles).toFixed(2)}</Text>
                                        <Text>Driving Time: {(totalDrivingTimeHours / totalVehicles).toFixed(2)} hours</Text>
                                        <Text>Distance: {(totalDistanceMiles / totalVehicles).toFixed(2)} miles</Text>
                                        <Text>Weight: {(totalLoadWeight / totalVehicles).toFixed(2)} kg</Text>
                                        <Text>Volume: {(totalLoadVolume / totalVehicles).toFixed(2)} m³</Text>
                                    </View>
                                    <View style={styles.gridBox}>
                                        <Text style={styles.subtitle}>Average Per Package</Text>
                                        <Text>Packages: n/a</Text>
                                        <Text>Driving Time: {(totalDrivingTimeHours / totalPackages).toFixed(2)} hours</Text>
                                        <Text>Distance: {(totalDistanceMiles / totalPackages).toFixed(2)} miles</Text>
                                        <Text>Weight: {(totalLoadWeight / totalPackages).toFixed(2)} kg</Text>
                                        <Text>Volume: {(totalLoadVolume / totalPackages).toFixed(2)} m³</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.subtitle}>Efficiency Metrics</Text>
                                <Text style={{ marginBottom: 10 }}>Higher efficiency scores indicate better performance. A utilisation score 
                                    of 100 indicates that the vehicle is being used to its full capacity.
                                </Text>
                                <Text><Text style={styles.subtitle}>Time Efficiency (TE) =</Text> Number of Packages / Time (minutes) * 100</Text>
                                <Text><Text style={styles.subtitle}>Distance Efficiency (DE) =</Text> Number of Packages / Distance (miles) * 100</Text>
                                <Text><Text style={styles.subtitle}>Weight Utilisation (WU) =</Text> Total Weight (kg) / Load Capacity (kg) * 100 </Text>
                                <Text style={{ marginBottom: 10 }}><Text style={styles.subtitle}>Volume Utilisation (VU) =</Text> Total Volume (m³) / Volume Capacity (m³) * 100</Text>

                                <View style={styles.table}>
                                    <View style={[styles.tableRow, styles.tableRowHeader]}>
                                        <Text style={styles.tableColNum}>#</Text>
                                        <Text style={styles.tableColHeader}>Vehicle</Text>
                                        <Text style={styles.tableColHeader}>TE</Text>
                                        <Text style={styles.tableColHeader}>DE</Text>
                                        <Text style={styles.tableColHeader}>WU</Text>
                                        <Text style={styles.tableColHeader}>VU</Text>
                                    </View>
                                    {/* Rows */}
                                    {props.schedules.map((schedule, index) =>
                                        schedule.vehicle && (
                                            <View key={index} style={styles.tableRow}>
                                                <Text style={styles.tableColNum}>{index + 1}</Text>
                                                <Text style={styles.tableCol}>{schedule.vehicle.registration}</Text>
                                                <Text style={styles.tableCol}>{(schedule.num_packages / schedule.actual_duration_mins * 100).toFixed(2)}</Text>
                                                <Text style={styles.tableCol}>{(schedule.num_packages / schedule.actual_distance_miles * 100).toFixed(2)}</Text>
                                                <Text style={styles.tableCol}>{(schedule.load_weight / schedule.vehicle.max_load * 100).toFixed(2)}</Text>
                                                <Text style={styles.tableCol}>{(schedule.load_volume / schedule.vehicle.max_volume * 100).toFixed(2)}</Text>
                                            </View>
                                        )
                                    )}
                                    <View style={styles.tableRow}>
                                        <Text style={[styles.tableCol, { width: '33%' }]}>Total</Text>
                                        <Text style={styles.tableCol}>{(totalPackages / (totalDrivingTimeHours * 60) * 100).toFixed(2)}</Text>
                                        <Text style={styles.tableCol}>{(totalPackages / totalDistanceMiles * 100).toFixed(2)}</Text>
                                        <Text style={styles.tableCol}>{(totalLoadWeight / totalMaxWeight * 100).toFixed(2)}</Text>
                                        <Text style={styles.tableCol}>{(totalLoadVolume / totalMaxVolume * 100).toFixed(2)}</Text>
                                    </View>
                                </View>
                            </View>
                        </Page>
                        <Page size="A4" style={styles.page}>
                            <Text style={styles.title}>Algorithm Information</Text>
                            <Text style={{ marginBottom: 10 }} >The solution with the greatest total efficiency value has been automatically selected:</Text>
                            <Text>Initialiser: {bestScheduleReport?.initialiser}</Text>
                            <Text>Optimiser: {bestScheduleReport?.optimiser}</Text>
                            {bestScheduleReport?.iterations && bestScheduleReport?.optimiser !== "Genetic Algorithm" &&
                                <Text>Iterations: {bestScheduleReport?.iterations}</Text>
                            }
                            {bestScheduleReport?.iterations && bestScheduleReport?.optimiser === "Genetic Algorithm" &&
                                <Text>Generations: {bestScheduleReport?.iterations}</Text>
                            }
                            <Text style={[styles.subtitle, { marginTop: 10 }]}>Network State</Text>
                            <Text>Vehicles available: {bestScheduleReport?.vehicles_available.length}</Text>
                            <Text>Vehicles used: {bestScheduleReport?.vehicles_used.length}</Text>
                            <Text>Packages pending: {bestScheduleReport?.total_packages_count}</Text>
                            <Text>Packages scheduled: {bestScheduleReport?.scheduled_packages_count}</Text>
                            <Text>Total Time Window: {bestScheduleReport?.time_window_hours! * props.schedules.length} hours</Text>


                            <Text style={[styles.subtitle, { marginTop: 10 }]}>Solution Comparison - Total Delivery Network</Text>
                            <Text style={{ marginBottom: 10 }}>Comparison of all generated solutions for the same set of vehicles and pending packages.</Text>
                            <View style={styles.table}>
                                <View style={[styles.tableRow, styles.tableRowHeader]}>
                                    <Text style={styles.tableColHeader}>Initialisation</Text>
                                    <Text style={styles.tableColHeader}>Optimisation</Text>
                                    <Text style={styles.tableColHeader}>Packages</Text>
                                    <Text style={styles.tableColHeader}>Time (hours)</Text>
                                    <Text style={styles.tableColHeader}>Distance (miles)</Text>
                                    <Text style={styles.tableColThin}>TE</Text>
                                    <Text style={styles.tableColThin}>DE</Text>
                                    <Text style={styles.tableColThin}>WU</Text>
                                    <Text style={styles.tableColThin}>VU</Text>
                                </View>

                                {/* Rows */}
                                {otherScheduleReports.map((report, index) =>
                                    report && (
                                        <View key={index} style={styles.tableRow}>
                                            <Text style={styles.tableCol}>{report.initialiser}</Text>
                                            <Text style={styles.tableCol}>
                                                {report.optimiser.split(' ').map((word, index, array) => (
                                                    <Text key={index}>
                                                        {word}{index < array.length - 1 ? '\n' : ''}
                                                    </Text>
                                                ))}
                                            </Text>
                                            <Text style={styles.tableCol}>{report.scheduled_packages_count}</Text>
                                            <Text style={styles.tableCol}>{report.total_duration_hours.toFixed(2)}</Text>
                                            <Text style={styles.tableCol}>{report.total_distance_miles.toFixed(2)}</Text>
                                            <Text style={styles.tableColThin}>{report.TE.toFixed(2)}</Text>
                                            <Text style={styles.tableColThin}>{report.DE.toFixed(2)}</Text>
                                            <Text style={styles.tableColThin}>{report.WU.toFixed(2)}</Text>
                                            <Text style={styles.tableColThin}>{report.VU.toFixed(2)}</Text>
                                        </View>
                                    )
                                )}
                                {/* Best Solution */}
                                <View style={[styles.tableRow, { fontFamily: 'Helvetica-Bold' }]}>
                                    <Text style={styles.tableCol}>{bestScheduleReport?.initialiser}</Text>
                                    <Text style={styles.tableCol}>
                                        {bestScheduleReport?.optimiser.split(' ').map((word, index, array) => (
                                            <Text key={index}>
                                                {word}{index < array.length - 1 ? '\n' : ''}
                                            </Text>
                                        ))}
                                    </Text>
                                    <Text style={styles.tableCol}>{bestScheduleReport?.scheduled_packages_count}</Text>
                                    <Text style={styles.tableCol}>{bestScheduleReport?.total_duration_hours.toFixed(2)}</Text>
                                    <Text style={styles.tableCol}>{bestScheduleReport?.total_distance_miles.toFixed(2)}</Text>
                                    <Text style={styles.tableColThin}>{bestScheduleReport?.TE.toFixed(2)}</Text>
                                    <Text style={styles.tableColThin}>{bestScheduleReport?.DE.toFixed(2)}</Text>
                                    <Text style={styles.tableColThin}>{bestScheduleReport?.WU.toFixed(2)}</Text>
                                    <Text style={styles.tableColThin}>{bestScheduleReport?.VU.toFixed(2)}</Text>
                                </View>
                            </View>

                        </Page>

                    </Document>
                </PDFViewer>
            }
        </>

    );
};

