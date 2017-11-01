
 export default pm.Vue.mixin({

 	data () {
 		return {
 			base_url: PM_Vars.base_url +'/'+ PM_Vars.rest_api_prefix,
 			project_id: typeof this.$route === 'undefined'? false : this.$route.params.project_id,
            current_user: PM_Vars.current_user,
            avatar_url: PM_Vars.avatar_url,
            text: PM_Vars.text,
 		}
 	},

	methods: {
		httpRequest (property) {
			var before = function( xhr ) {
			    xhr.setRequestHeader("Authorization_name", btoa('asaquzzaman')); //btoa js encoding base64_encode
			    xhr.setRequestHeader("Authorization_password", btoa(12345678)); //atob js decode base64_decode
			};

			property.beforeSend = typeof property.beforeSend === 'undefined' ? before : property.beforeSend;

			jQuery.ajax(property);
		},

        /**
         * Create a new project 
         * @param  {[Object]} args data with callback
         * @return {viod}      [description]
         */
        newProject (args) {
            var self = this,
            pre_define = {
                data: {
                    title : '',
                    categories : '',
                    description: '',
                    notify_users: '',
                    assignees: '',
                    status: 'incomplete'
                },
                callback: false,
            },
            args = jQuery.extend(true, pre_define, args );

            var request = {
                type: 'POST',
                url: this.base_url + '/pm/v2/projects/',
                data: args.data,
                success: function(res) {
                    self.$root.$store.commit('newProject', res.data);
                    self.showHideProjectForm(false);
                    self.resetSelectedUsers();
                    jQuery( "#pm-project-dialog" ).dialog("close");

                    if(typeof args.callback === 'function'){
                        args.callback.call(self, res);
                    }
                },

                error: function(res) {
                    if(typeof args.callback === 'function'){
                        args.callback.call(self, res);
                    }
                }
            };

            this.httpRequest(request);
        },

        formatUsers (users) {
            var format_users = [];
            
            users.map(function(user, index) {
                format_users.push({
                    'user_id': user.id,
                    'role_id': user.roles.data[0].id
                });
            });

            return format_users;
        },

        updateProject (args) {
            var self = this,
            pre_define = {
              data: {
                id: '',
                title : '',
                categories : '',
                description: '',
                notify_users: '',
                assignees: '',
                status: 'incomplete'
              },
              callback: false,
            },
            args = jQuery.extend(true, pre_define, args );

            var request = {
                type: 'PUT',
                url: this.base_url + '/pm/v2/projects/'+ args.data.id,
                data: args.data,
                success: function(res) {
                    
                    self.$root.$store.commit('updateProject', res.data);
                   
                    self.showHideProjectForm(false);
                    jQuery( "#pm-project-dialog" ).dialog("close");
                    self.resetSelectedUsers();
                    if(typeof args.callback === 'function'){
                        args.callback.call(self, res);
                    }
                },

                error: function(res) {
                    if(typeof args.callback === 'function'){
                        args.callback.call(self, res);
                    }                    
                }
            };
            
            this.httpRequest(request);
        },

        resetSelectedUsers () {
            this.$root.$store.commit('resetSelectedUsers');
        },

        getProjects (condition, callback) {
            var condition = condition || '';
            var self = this;

            var request_data = {
                url: self.base_url + '/pm/v2/projects?per_page=2&page='+ self.setCurrentPageNumber(self) +'&'+ condition,
                success: function(res) {
                    res.data.map(function(project) {
                        self.addProjectMeta(project);
                    });
                    self.$root.$store.commit('setProjects', {'projects': res.data});
                    self.$root.$store.commit('setProjectsMeta', res.meta );
                    pm.NProgress.done();
                    self.loading = false;
                    if(typeof callback !== 'undefined'){
                        callback(res.data);
                    }
                }
            };

            self.httpRequest(request_data);
        },

        setCurrentPageNumber (self) {
            var current_page_number = self.$route.params.current_page_number ? self.$route.params.current_page_number : 1;
            self.current_page_number = current_page_number;
            return current_page_number;
        },

		getProject (project_id, callback) {
			var self = this;
            
            var callback   = callback || false;
			var project_id = project_id || self.project_id;

			if ( typeof self.project_id === 'undefined' ) {
				return;
			}

            var projects = self.$root.$store.state.projects,
                index = self.getIndex(projects, project_id, 'id');

            if ( index !== false ) {
                self.addProjectMeta(projects[index]);
                self.$root.$store.commit('setProject', projects[index]);
                self.$root.$store.commit('setProjectUsers', projects[index].assignees.data);
                if (callback) {
                    callback(res.data);
                }
            } else {
                self.httpRequest({
                    url: self.base_url + '/pm/v2/projects/'+ self.project_id,
                    success: function(res) {
                        self.addProjectMeta(res.data);
                        self.$root.$store.commit('setProject', res.data);
                        self.$root.$store.commit('setProjectUsers', res.data.assignees.data);

                        if (callback) {
                            callback(res.data);
                        }
                    }
                });
            }
        },

        addProjectMeta (project) {
            project.edit_mode = false;
            project.settings_hide = false;
        },

        getProjectCategories (callback) {
            var callback = callback || false;
            var self = this;

            var categories = self.$root.$store.state.categories;

            if ( categories.length ) {
                if (callback) {
                    //callback(categories);
                }
                return categories;
            }

            this.httpRequest({
                url: self.base_url + '/pm/v2/categories?type=project',
                success: function(res) {
                    self.$root.$store.commit('setCategories', res.data);

                    if (callback) {
                        callback(res.data);
                    }
                }
            });
        },

        getRoles (callback) {
            var callback = callback || false;
            var self = this;

            var roles = self.$root.$store.state.roles;

            if ( roles.length ) {
                if (callback) {
                    callback(roles);
                }
                return roles;
            }

            self.httpRequest({
                url: self.base_url + '/pm/v2/roles',
                success: function(res) {
                    self.$root.$store.commit('setRoles', res.data);

                    if (callback) {
                        callback(res.data);
                    }
                }
            });
        },
        /**
         * Get index from array object element
         *
         * @param   itemList
         * @param   id
         *
         * @return  int
         */
        getIndex: function ( itemList, id, slug) {
            var index = false;

            itemList.forEach(function(item, key) {
                if (item[slug] == id) {
                    index = key;
                }
            });

            return index;
        },

        showHideProjectForm (status) {
            this.$root.$store.commit('showHideProjectForm', status);
        },

        deleteFile (file_id, callback) {
            var self = this;

            self.httpRequest({
                url: self.base_url + '/pm/v2/projects/'+self.project_id+'/files/' + file_id,
                type: 'DELETE',
                success: function(res) {
                    

                    if (typeof callback !== 'undefined') {
                        callback(res.data);
                    }
                }
            });
        },


        userTaskProfileUrl ( user_id ) {
            return PM_Vars.ajaxurl + '?page=pm_task#/user/' + user_id;
        },

        /**
         * Set extra element in httpRequest query
         */
        getQueryParams (add_query) {

            var self = this,
                query_str = '';

             jQuery.each(add_query, function(key, val) {
                
                if (Array.isArray(val)) {

                    val.map(function(el, index) {
                        query_str = query_str + key +'='+ el + '&'; 
                    });
                } else {
                    query_str = query_str + key +'='+ val + '&'; 
                }
                
            });
                

            jQuery.each(this.$route.query, function(key, val) {
                
                if (Array.isArray(val)) {

                    val.map(function(el, index) {
                        query_str = query_str + key +'='+ el + '&'; 
                    });
                } else {
                    query_str = query_str + key +'='+ val + '&'; 
                }
                
            });

            var query_str = query_str.slice(0, -1);

            return query_str;
        },

        /**
         * Set extra element in this.$route.query
         */
        setQuery (add_query) {
            var self = this,
                route_query = {};


            jQuery.each(self.$route.query, function(key, val) {
                if (Array.isArray(val)) {
                    route_query[key] = [];
                    
                    val.map(function(el, index) {
                        route_query[key].push(el);
                    });
                
                } else if (val) {
                    route_query[key] = [val];
                }
                
            });

            jQuery.each(add_query, function(key, val) {
                if (val) {
                    route_query[key] = [val];
                } else {
                    delete route_query[key];
                }
                
            });
            
            return route_query;
        },

        /**
         * ISO_8601 Date format convert to moment date format
         * 
         * @param  string date 
         * 
         * @return string      
         */
        pmDateISO8601Format: function( date, time ) {
            var date = new Date(date +' '+ time);
            
            return pm.Moment( date).format();
        },

        deleteProject (id) {
            if ( ! confirm( this.text.delete_project_conf ) ) {
                return;
            }
            var self = this;
            var request_data = {
                url: self.base_url + '/pm/v2/projects/' + id,
                type: 'DELETE',
                success: function(res) {
                    self.$root.$store.commit('afterDeleteProject', id);

                    if (!self.$root.$store.state.projects.length) {
                        self.$router.push({
                            name: 'project_lists', 
                        });
                    } else {
                        self.getProjects();
                    }
                }
            }

            self.httpRequest(request_data);
        },

        addUserMeta (user) {
            if(!user.roles.data.length) {
                user.roles = {
                    data: [{
                        description: "Co-Worker for project manager",
                        id:2,
                        title:"Co-Worker"
                    }]
                }
            } 
        },
        projects_view_class (){
            return this.$store.state.projects_view === 'grid_view' ? 'pm-project-grid': 'pm-project-list'
        },

        generateConditions (conditions) {
            var query = '';

            if (jQuery.isEmptyObject(conditions)) {
                return ''
            }

            jQuery.each(conditions, function(condition, key) {
                query = query + condition +'='+ key +'&';
            });

            return query.slice(0, -1);
        },
        /**
         * [get Global Milestones in every page where milestone need and store in $root.$store.state.milestone ]
         * @param  {Function} callback [optional]
         * @return {[type]}            [milestone]
         */
        getGlobalMilestones (callback) {
          var self = this,
          milestones = this.$root.$store.state.milestones,
          milestones_load = self.$root.$store.state.milestones_load;

          if(milestones_load){
            if(typeof callback === 'function' ){
                callback.call(self, milestones);
            }
            return milestones;
          }else {
            var request = {
              url: self.base_url + '/pm/v2/projects/'+self.project_id+'/milestones',
              success (res) {
                self.$root.$store.commit( 'setMilestones', res.data );

                if (typeof callback === 'function') {
                  callback.call( self, res.data);
                }
              }
            };
            self.httpRequest(request);
          }    
        }
	}
});
