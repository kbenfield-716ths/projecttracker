import React, { useState, useEffect } from 'react';
import { Play, Pause, Plus, Trash2, Clock } from 'lucide-react';

export default function ProjectTracker() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [activeTimer, setActiveTimer] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for active timers
  useEffect(() => {
    if (activeTimer !== null) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTimer]);

  const addProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: Date.now(),
        name: newProjectName,
        totalTime: 0,
        startTime: null,
        isRunning: false
      };
      setProjects([...projects, newProject]);
      setNewProjectName('');
      // Auto-select the new project for task creation
      setSelectedProjectId(newProject.id);
    }
  };

  const addTask = () => {
    if (newTaskName.trim() && selectedProjectId) {
      setTasks([...tasks, {
        id: Date.now(),
        name: newTaskName,
        projectId: parseInt(selectedProjectId),
        totalTime: 0,
        startTime: null,
        isRunning: false
      }]);
      setNewTaskName('');
    }
  };

  const deleteTask = (id) => {
    if (activeTimer === id) {
      setActiveTimer(null);
    }
    setTasks(tasks.filter(t => t.id !== id));
  };

  const deleteProject = (id) => {
    if (activeTimer === id) {
      setActiveTimer(null);
    }
    // Also delete tasks associated with this project
    setTasks(tasks.filter(t => t.projectId !== id));
    setProjects(projects.filter(p => p.id !== id));
  };

  const toggleTimer = (id, type = 'project') => {
    const items = type === 'project' ? projects : tasks;
    const setItems = type === 'project' ? setProjects : setTasks;
    
    setItems(items.map(item => {
      if (item.id === id) {
        if (item.isRunning) {
          // Stop timer
          const elapsed = Date.now() - item.startTime;
          return {
            ...item,
            totalTime: item.totalTime + elapsed,
            startTime: null,
            isRunning: false
          };
        } else {
          // Start timer
          return {
            ...item,
            startTime: Date.now(),
            isRunning: true
          };
        }
      } else if (item.isRunning) {
        // Stop other running timers
        const elapsed = Date.now() - item.startTime;
        return {
          ...item,
          totalTime: item.totalTime + elapsed,
          startTime: null,
          isRunning: false
        };
      }
      return item;
    }));

    // Also stop timers in the other list
    const otherItems = type === 'project' ? tasks : projects;
    const setOtherItems = type === 'project' ? setTasks : setProjects;
    
    setOtherItems(otherItems.map(item => {
      if (item.isRunning) {
        const elapsed = Date.now() - item.startTime;
        return {
          ...item,
          totalTime: item.totalTime + elapsed,
          startTime: null,
          isRunning: false
        };
      }
      return item;
    }));

    // Update active timer
    const item = items.find(i => i.id === id);
    if (item && !item.isRunning) {
      setActiveTimer(id);
    } else {
      setActiveTimer(null);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = (item) => {
    if (item.isRunning) {
      const currentElapsed = currentTime - item.startTime;
      return formatTime(item.totalTime + currentElapsed);
    }
    return formatTime(item.totalTime);
  };

  const getProjectTotalTime = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 0;
    
    const projectTime = project.isRunning 
      ? project.totalTime + (currentTime - project.startTime)
      : project.totalTime;
    
    const taskTime = tasks
      .filter(t => t.projectId === projectId)
      .reduce((sum, t) => {
        const time = t.isRunning 
          ? t.totalTime + (currentTime - t.startTime)
          : t.totalTime;
        return sum + time;
      }, 0);
    
    return projectTime + taskTime;
  };

  const getProjectTaskCount = (projectId) => {
    return tasks.filter(t => t.projectId === projectId).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            Project Time Tracker
          </h1>

          {/* Project Overview Grid */}
          {projects.length > 0 && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
              <h2 className="text-xl font-bold text-slate-700 mb-4">Project Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map(project => (
                  <div key={project.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
                    <h3 className="font-semibold text-slate-800 mb-2">{project.name}</h3>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">{getProjectTaskCount(project.id)} tasks</span>
                      <span className="font-mono font-bold text-blue-600">
                        {formatTime(getProjectTotalTime(project.id))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Project */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-2">Add Project</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addProject()}
                placeholder="Project name..."
                className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={addProject}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Add Project
              </button>
            </div>
          </div>

          {/* Add Task */}
          {projects.length > 0 && (
            <div className="mb-8 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
              <h2 className="text-lg font-semibold text-slate-700 mb-2">Add Task</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Task name..."
                  className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-green-500 focus:outline-none bg-white"
                >
                  <option value="">Select Project</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
                <button
                  onClick={addTask}
                  disabled={!selectedProjectId}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  Add Task
                </button>
              </div>
            </div>
          )}

          {/* Tasks List */}
          {tasks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Tasks</h2>
              <div className="space-y-2">
                {tasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        task.isRunning
                          ? 'bg-green-50 border-green-500 shadow-md'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-800">{task.name}</h3>
                        <p className="text-sm text-slate-500">
                          Project: {project?.name || 'Unknown'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={`text-xl font-mono font-bold ${
                          task.isRunning ? 'text-green-600' : 'text-slate-700'
                        }`}>
                          {getDisplayTime(task)}
                        </div>
                        
                        <button
                          onClick={() => toggleTimer(task.id, 'task')}
                          className={`p-2 rounded-lg transition-all ${
                            task.isRunning
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {task.isRunning ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Projects List */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Projects</h2>
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No projects yet. Add one to get started!</p>
                </div>
              ) : (
                projects.map(project => (
                  <div
                    key={project.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      project.isRunning
                        ? 'bg-blue-50 border-blue-500 shadow-md'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-800">{project.name}</h3>
                      <p className="text-sm text-slate-500">{getProjectTaskCount(project.id)} tasks</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-mono font-bold ${
                        project.isRunning ? 'text-blue-600' : 'text-slate-700'
                      }`}>
                        {getDisplayTime(project)}
                      </div>
                      
                      <button
                        onClick={() => toggleTimer(project.id, 'project')}
                        className={`p-3 rounded-lg transition-all ${
                          project.isRunning
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        {project.isRunning ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => deleteProject(project.id)}
                        className="p-3 bg-slate-200 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Total Time */}
          {projects.length > 0 && (
            <div className="mt-8 pt-6 border-t-2 border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-slate-600">Total Time (All Projects + Tasks):</span>
                <span className="text-2xl font-mono font-bold text-slate-800">
                  {formatTime(
                    projects.reduce((sum, p) => sum + getProjectTotalTime(p.id), 0)
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}