<template>
    <div>
        <div class="tc-sync-status">
            <div class="tc-sync-exported tc-sync-text"
                 v-if="status === 'EXPORTED' ||
                       status === 'NOT_EXPORTED' ||
                       status === 'EXPORT_UPDATE_NEEDED'">Synchronisation aktiv
            </div>
            <div class="tc-sync-denied tc-sync-text"
                 v-if="status === 'DELETE_REQUEST' || status === 'DELETE_REQUEST_SUCCESS'">Synchronisation beendet
            </div>
            <div class="tc-sync-requested tc-sync-text"
                 v-if="status === 'EXPORT_REQUESTED'">Warte auf Freigabe
            </div>
            <div class="tc-sync-denied tc-sync-text"
                 v-if="status === 'EXPORT_DENIED'">Synchronisation abgelehnt
            </div>
        </div>
        <div class="tc-sync-status-text" v-if="status === 'EXPORTED'">Synchronisation ist auf dem aktuellen Stand.</div>
        <div class="tc-sync-status-text" v-if="status === 'EXPORT_UPDATE_NEEDED' || status === 'NOT_EXPORTED'">
            Synchronisation wird aktualisiert. Dies kann einige Minuten dauern.
        </div>
        <div class="tc-sync-status-text" v-if="status === 'DELETE_REQUEST'">
            Synchronisation wird beendet. Dies kann einige Minuten dauern.
        </div>
        <div class="tc-sync-status-text" v-if="status === 'DELETE_REQUEST_SUCCESS'">
            Synchronisation wurde beendet.
        </div>
        <div class="tc-sync-status-text" v-if="status === 'EXPORT_REQUESTED'">
            Synchronisation muss von Plattform bestätigt werden.
        </div>
        <div class="tc-sync-status-text" v-if="status === 'EXPORT_UPDATE_NEEDED'">
            Es kann einige Minuten dauern bis die Änderungen synchronisiert werden.
        </div>
        <div class="tc-sync-status-text" v-if="status === 'EXPORT_DENIED'">
            Die Synchronisationsanfrage wurde abgelehnt.
        </div>
    </div>
</template>

<script>
    import moment from 'moment';

    export default {
        props: ['status', 'lastUpdate'],
        computed: {
            getDateTime: function () {
                return moment.unix(this.lastUpdate).format('LLL')
            }
        }
    }
</script>

<style lang="scss">
    @import "../../../../style/variable";

    .tc-sync-status {
        margin: 6px 0;
        color: #ffffff;
        display: inline-block;
        line-height: 22px;
        .tc-sync-text {
            padding: 3px 6px;
            border-radius: 4px;
        }
        .tc-sync-exported {
            background-color: $success;
        }
        .tc-sync-running {
            background-color: #558B2F;
        }
        .tc-sync-requested {
            background-color: $warning;
        }
        .tc-sync-denied {
            background-color: $error;
        }
    }

    .tc-sync-status-text {
        margin: 6px 0;
        padding: 3px 8px;
        display: inline-block;
        line-height: 22px;
    }
</style>
