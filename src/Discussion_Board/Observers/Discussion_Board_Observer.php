<?php

namespace CPM\Discussion_Board\Observers;

use CPM\Core\Database\Model_Observer;
use CPM\Activity\Models\Activity;
use CPM\Discussion_Board\Models\Discussion_Board;
use Reflection;

class Discussion_Board_Observer extends Model_Observer {

    public function created( $resource ) {
        $meta = [
            'discussion_board_title' => $resource->title,
        ];

        $this->log_activity( $resource, 'create-discussion-board', 'create', $meta );
    }

    public function updated( $resource ) {
        $this->call_attribute_methods( $resource );
    }

    public function title( Discussion_Board $item, $old_value ) {
        $meta = [
            'discussion_board_title_old' => $old_value,
            'discussion_board_title_new' => $item->title,
        ];
        $this->log_activity( $item, 'update-discussion-board-title', 'update', $meta );
    }

    public function description( Discussion_Board $item, $old_value ) {
        $meta = [
            'discussion_board_title' => $item->title,
        ];

        $this->log_activity( $item, 'update-discussion-board-description', 'update', $meta );
    }

    public function order( Discussion_Board $item, $old_value ) {
        $meta = [
            'discussion_board_title'     => $item->title,
            'discussion_board_order_old' => $old_value,
            'discussion_board_order_new' => $item->order,
        ];

        $this->log_activity( $item, 'update-discussion-board-order', 'update', $meta );
    }

    private function log_activity( Discussion_Board $item, $action, $action_type, $meta = null ) {
        Activity::create([
            'actor_id'      => $item->updated_by,
            'action'        => $action,
            'action_type'   => $action_type,
            'resource_id'   => $item->id,
            'resource_type' => 'discussion-board',
            'meta'          => $meta,
            'project_id'    => $item->project_id,
        ]);
    }
}